import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  users,
  matches,
  markets,
  odds,
  tickets,
  ticketSelections,
  withdrawals,
  conversationSessions,
  messages,
  transactions,
} from "@whatsbet/database";
import {
  parseCommand,
  normalizePhone,
  formatCdf,
  isValidDisplayPhone,
  lidPlaceholderPhone,
  BetEngine,
  QuickBetEngine,
  DEFAULT_QUICKBET_STAKE,
  parseProvinceChoice,
  formatProvinceMenu,
  validateCityName,
  getProvinceById,
} from "@whatsbet/shared";
import type { WhatsAppInboundMessage } from "@whatsbet/types";
import {
  initiateMobilePayment,
  isValidMobileMoneyPhone,
  phoneForSimplyPaye,
  SimplyPayeError,
} from "@/lib/simplypaye";
import { reconcilePendingDeposits } from "@/lib/deposits";
import { recordBet } from "@/lib/ledger";
import { logUserNotification } from "@/lib/notifications";

async function getOrCreateUser(phone: string | null | undefined, name?: string, jid?: string) {
  const db = getDb();
  const normalized = phone ? normalizePhone(phone) : null;
  const validPhone = normalized && isValidDisplayPhone(normalized) ? normalized : null;
  const placeholderPhone = !validPhone && jid?.includes("@lid") ? lidPlaceholderPhone(jid) : null;

  let existing = null;
  if (jid) {
    [existing] = await db.select().from(users).where(eq(users.whatsappJid, jid)).limit(1);
  }

  if (!existing && jid?.includes("@lid")) {
    const lidDigits = jid.split("@")[0] ?? "";
    const legacyPhones = [`+${lidDigits}`, lidDigits, lidPlaceholderPhone(jid)];
    for (const legacy of legacyPhones) {
      [existing] = await db.select().from(users).where(eq(users.phone, legacy)).limit(1);
      if (existing) break;
    }
  }

  if (!existing && validPhone) {
    [existing] = await db.select().from(users).where(eq(users.phone, validPhone)).limit(1);
  }

  if (!existing && placeholderPhone) {
    [existing] = await db.select().from(users).where(eq(users.phone, placeholderPhone)).limit(1);
  }

  const storePhone = validPhone ?? placeholderPhone ?? (phone || "unknown");

  if (existing) {
    const updates: { name?: string; whatsappJid?: string; phone?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (name) updates.name = name;
    if (jid) updates.whatsappJid = jid;
    if (validPhone && existing.phone !== validPhone) {
      const [conflict] = await db.select().from(users).where(eq(users.phone, validPhone)).limit(1);
      if (!conflict || conflict.id === existing.id) {
        updates.phone = validPhone;
      }
    }
    if (Object.keys(updates).length > 1) {
      await db.update(users).set(updates).where(eq(users.id, existing.id));
      return { ...existing, ...updates };
    }
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      phone: storePhone,
      name: name ?? undefined,
      whatsappJid: jid ?? undefined,
    })
    .returning();
  return created;
}

async function getSession(userId: string) {
  const db = getDb();
  const [session] = await db
    .select()
    .from(conversationSessions)
    .where(eq(conversationSessions.userId, userId))
    .limit(1);
  return session;
}

async function setSession(userId: string, step: string, context: Record<string, unknown> = {}) {
  const db = getDb();
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  const existing = await getSession(userId);
  if (existing) {
    await db
      .update(conversationSessions)
      .set({ step, context, expiresAt: expires, updatedAt: new Date() })
      .where(eq(conversationSessions.id, existing.id));
  } else {
    await db.insert(conversationSessions).values({ userId, step, context, expiresAt: expires });
  }
}

function helpMessage(): string {
  return `🏟 *WhatsBet by Betika*

👋 Bienvenue ! Que souhaitez-vous faire ?

*1.* matchs — Voir les matchs du jour
*2.* pari — Construire un ticket
*3.* quick — QuickBet (sûr / équilibré / jackpot / IA)
*4.* ticket — Vos tickets
*5.* solde — Votre solde
*6.* depot — Déposer de l'argent
*7.* retrait — Retirer de l'argent
*8.* aide — Afficher ce menu

Répondez avec le *numéro* ou le *mot-clé* (ex: *1* ou *matchs*).`;
}

function needsLocationProfile(user: { province: string | null; city: string | null }): boolean {
  return !user.province || !user.city;
}

function provinceOnboardingMessage(name?: string): string {
  const greeting = name?.trim() ? `Bonjour *${name.trim()}* ! 👋\n\n` : "👋 Bienvenue sur *WhatsBet* !\n\n";
  return `${greeting}Pour commencer, indiquez votre *province* en RDC.\n\n${formatProvinceMenu()}\n\nRépondez avec le *numéro* ou le *nom* de votre province.`;
}

function cityOnboardingMessage(provinceId: string): string {
  const province = getProvinceById(provinceId);
  const label = province?.name ?? provinceId;
  return `✅ Province : *${label}*\n\nMaintenant, indiquez votre *ville* (ex: Kinshasa, Goma, Lubumbashi…) :`;
}

function onboardingCompleteMessage(provinceId: string, city: string): string {
  const province = getProvinceById(provinceId);
  const label = province?.name ?? provinceId;
  return `✅ Profil enregistré : *${label}*, ${city}\n\n${helpMessage()}`;
}

function isGreeting(text: string): boolean {
  return /^(bonjour|bonsoir|salut|hello|hi|hey|coucou|bjr|bon matin|bonne nuit)\b/i.test(text.trim());
}

async function listMatches(): Promise<string> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(matches)
    .where(and(gte(matches.startTime, now), eq(matches.status, "scheduled")))
    .orderBy(matches.startTime)
    .limit(10);

  if (rows.length === 0) {
    return "Aucun match disponible pour le moment.\n\nUn admin peut lancer *Sync* dans le dashboard (Matchs) puis réessayez *1* ou *matchs*.";
  }

  let msg = "🏟 *MATCHS DU JOUR*\n\n";
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i];
    const matchOdds = await db
      .select({ selection: odds.selection, value: odds.value })
      .from(odds)
      .innerJoin(markets, eq(odds.marketId, markets.id))
      .where(and(eq(markets.matchId, m.id), eq(markets.type, "1x2")))
      .limit(3);

    const oddsLine = matchOdds.length
      ? matchOdds.map((o) => `${o.selection}: *${parseFloat(o.value).toFixed(2)}*`).join(" | ")
      : "Cotes bientôt disponibles";

    msg += `*${i + 1}.* ${m.homeTeam} vs ${m.awayTeam}\n`;
    msg += `   📊 ${oddsLine}\n`;
    msg += `   🕐 ${new Date(m.startTime).toLocaleString("fr-FR")} | ${m.league}\n\n`;
  }
  msg += "Répondez *3* ou *quick* pour parier\nRépondez *5* ou *solde* pour votre solde";
  return msg;
}

type QuickBetType = "safe" | "balanced" | "jackpot" | "custom";

async function fetchAvailableOdds() {
  const db = getDb();
  const rows = await db
    .select({
      matchId: matches.id,
      oddId: odds.id,
      selection: odds.selection,
      oddValue: odds.value,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      league: matches.league,
    })
    .from(odds)
    .innerJoin(markets, eq(odds.marketId, markets.id))
    .innerJoin(matches, eq(markets.matchId, matches.id))
    .where(and(eq(odds.isActive, true), eq(matches.status, "scheduled"), eq(markets.type, "1x2")))
    .limit(100);

  return rows.map((o) => ({ ...o, oddValue: parseFloat(o.oddValue) }));
}

function formatQuickBetPreview(type: QuickBetType, selections: ReturnType<typeof QuickBetEngine.generate>, stake: number, ticket: ReturnType<typeof BetEngine.build>, mapped: Awaited<ReturnType<typeof fetchAvailableOdds>>) {
  let msg = `⚡ *QuickBet ${type.toUpperCase()}* — aperçu\n\n`;
  selections.forEach((s, i) => {
    const match = mapped.find((m) => m.matchId === s.matchId);
    msg += `${i + 1}. ${match?.homeTeam} vs ${match?.awayTeam} → ${s.selection} (×${s.oddValue.toFixed(2)})\n`;
  });
  msg += `\n💰 Mise : ${formatCdf(stake)}\n📊 Cote totale : ×${ticket.totalOdds.toFixed(2)}\n🎯 Gain potentiel : ${formatCdf(ticket.potentialWin)}\n\n`;
  msg += `*1* — Accepter le ticket\n*2* — Régénérer\n*annuler* — Abandonner`;
  return msg;
}

async function previewQuickBet(userId: string, choice?: string): Promise<string> {
  const stake = DEFAULT_QUICKBET_STAKE;
  const mapped = await fetchAvailableOdds();
  if (mapped.length === 0) return "Aucune cote disponible. Réessayez plus tard.";

  const typeMap: Record<string, QuickBetType> = {
    "1": "safe",
    "2": "balanced",
    "3": "jackpot",
    "4": "custom",
  };
  const type = typeMap[choice ?? "2"] ?? "balanced";

  const [user] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || parseFloat(user.balance) < stake) {
    return `Solde insuffisant. Mise requise : ${formatCdf(stake)}. Tapez *depot* pour recharger.`;
  }

  try {
    const selections = QuickBetEngine.generate(type, mapped, stake, 3);
    const ticket = BetEngine.build({ userId, stake, selections });
    await setSession(userId, "quickbet_confirm", {
      type,
      stake,
      selections,
      totalOdds: ticket.totalOdds,
      potentialWin: ticket.potentialWin,
    });
    return formatQuickBetPreview(type, selections, stake, ticket, mapped);
  } catch (e) {
    return e instanceof Error ? e.message : "Erreur QuickBet";
  }
}

async function placeQuickBetFromSession(userId: string): Promise<string> {
  const db = getDb();
  const session = await getSession(userId);
  const ctx = session?.context as {
    type?: QuickBetType;
    stake?: number;
    selections?: Array<{ matchId: string; oddId: string; selection: string; oddValue: number }>;
    totalOdds?: number;
    potentialWin?: number;
  } | null;

  if (!ctx?.selections?.length || !ctx.stake) {
    await setSession(userId, "idle");
    return "Session expirée. Tapez *quick* pour recommencer.";
  }

  const stake = ctx.stake;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || parseFloat(user.balance) < stake) {
    await setSession(userId, "idle");
    return `Solde insuffisant. Mise requise : ${formatCdf(stake)}. Tapez *depot* pour recharger.`;
  }

  const ticket = BetEngine.build({ userId, stake, selections: ctx.selections });

  const [created] = await db
    .insert(tickets)
    .values({
      userId,
      stake: String(stake),
      totalOdds: String(ticket.totalOdds),
      potentialWin: String(ticket.potentialWin),
      isQuickBet: true,
      quickBetType: ctx.type ?? "balanced",
    })
    .returning();

  for (const sel of ctx.selections) {
    await db.insert(ticketSelections).values({
      ticketId: created.id,
      matchId: sel.matchId,
      oddId: sel.oddId,
      selection: sel.selection,
      oddValue: String(sel.oddValue),
    });
  }

  const newBalance = parseFloat(user.balance) - stake;
  await db.update(users).set({ balance: String(newBalance), updatedAt: new Date() }).where(eq(users.id, userId));
  await recordBet({ userId, amount: stake, ticketId: created.id, metadata: { quickBetType: ctx.type } });

  const mapped = await fetchAvailableOdds();
  let msg = `✅ *Ticket confirmé !*\n\n`;
  ctx.selections.forEach((s, i) => {
    const match = mapped.find((m) => m.matchId === s.matchId);
    msg += `${i + 1}. ${match?.homeTeam} vs ${match?.awayTeam} → ${s.selection} (×${s.oddValue.toFixed(2)})\n`;
  });
  msg += `\n💰 Mise : ${formatCdf(stake)}\n📊 Cote : ×${ticket.totalOdds.toFixed(2)}\n🎯 Gain potentiel : ${formatCdf(ticket.potentialWin)}\n\nBon jeu ! 🍀`;

  await logUserNotification({
    userId,
    type: "ticket_created",
    message: msg,
    sent: true,
  });

  await setSession(userId, "idle");
  return msg;
}

async function persistMessages(userId: string, incoming: string, replies: string[]) {
  try {
    const db = getDb();
    await db.insert(messages).values({ userId, text: incoming, fromMe: false });
    for (const reply of replies) {
      await db.insert(messages).values({ userId, text: reply, fromMe: true });
    }
  } catch {
    // DB may not be ready
  }
}

export async function handleWhatsAppMessage(message: WhatsAppInboundMessage): Promise<string[]> {
  const replies: string[] = [];
  const user = await getOrCreateUser(message.from, message.name, message.jid);
  const text = message.text.trim();

  if (user.status === "blocked") {
    return persistMessages(user.id, text, ["❌ Votre compte est bloqué. Contactez le support."]).then(() => ["❌ Votre compte est bloqué. Contactez le support."]);
  }

  await reconcilePendingDeposits({ userId: user.id });

  const db = getDb();
  const [freshUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const activeUser = freshUser ?? user;
  const cmd = parseCommand(text);
  const session = await getSession(user.id);

  if (session?.step === "awaiting_province") {
    const province = parseProvinceChoice(text);
    if (!province) {
      replies.push(`Province non reconnue. Répondez avec un numéro (1–26) ou le nom exact.\n\n${formatProvinceMenu()}`);
      return persistMessages(user.id, text, replies).then(() => replies);
    }

    await db
      .update(users)
      .set({ province: province.id, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await setSession(user.id, "awaiting_city", { provinceId: province.id });
    replies.push(cityOnboardingMessage(province.id));
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "awaiting_city") {
    const provinceId =
      (session.context as { provinceId?: string })?.provinceId ?? activeUser.province ?? undefined;
    if (!provinceId) {
      await setSession(user.id, "awaiting_province");
      replies.push(provinceOnboardingMessage(message.name));
      return persistMessages(user.id, text, replies).then(() => replies);
    }

    const city = validateCityName(text);
    if (!city) {
      replies.push("Ville invalide. Entrez le nom de votre ville (2 à 100 caractères, ex: *Goma*).");
      return persistMessages(user.id, text, replies).then(() => replies);
    }

    await db
      .update(users)
      .set({ city, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await setSession(user.id, "idle");
    replies.push(onboardingCompleteMessage(provinceId, city));
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (needsLocationProfile(activeUser)) {
    if (!activeUser.province) {
      await setSession(user.id, "awaiting_province");
      replies.push(provinceOnboardingMessage(message.name));
    } else {
      await setSession(user.id, "awaiting_city", { provinceId: activeUser.province });
      replies.push(cityOnboardingMessage(activeUser.province));
    }
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  // Réponse numérique au menu (1-8)
  const menuChoice = text.trim();
  const menuMap: Record<string, string> = {
    "1": "matchs",
    "2": "pari",
    "3": "quick",
    "4": "ticket",
    "5": "solde",
    "6": "depot",
    "7": "retrait",
    "8": "aide",
  };
  const resolvedCmd = menuMap[menuChoice] ?? cmd;

  if (session?.step === "awaiting_deposit_amount") {
    const amount = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 500) {
      replies.push("Montant minimum : 500 CDF. Réessayez.");
      return persistMessages(user.id, text, replies).then(() => replies);
    }
    await setSession(user.id, "awaiting_deposit_mobile_money", { amount });
    replies.push(
      `💳 Dépôt de *${formatCdf(amount)}*\n\nEntrez votre numéro Mobile Money (ex: +243XXXXXXXXX).\nUne notification push vous sera envoyée pour valider avec votre code PIN.`
    );
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "awaiting_deposit_mobile_money") {
    const amount = (session.context as { amount?: number })?.amount ?? 0;
    const mobilePhone = normalizePhone(text);

    if (!isValidMobileMoneyPhone(mobilePhone)) {
      replies.push("Numéro invalide. Entrez un numéro Mobile Money congolais (ex: +243812345678).");
      return persistMessages(user.id, text, replies).then(() => replies);
    }

    const reference = `WB-${user.id.slice(0, 8)}-${Date.now()}`;

    try {
      const payment = await initiateMobilePayment({
        phone: phoneForSimplyPaye(mobilePhone),
        amount,
        reference,
      });

      const db = getDb();
      await db.insert(transactions).values({
        userId: user.id,
        type: "deposit",
        amount: String(amount),
        status: "pending",
        reference: payment.orderNumber,
        idempotencyKey: reference,
        metadata: {
          mobileMoneyPhone: mobilePhone,
          orderNumber: payment.orderNumber,
          simplyPaye: payment.raw,
        },
      });

      await setSession(user.id, "idle");
      replies.push(
        `📲 Demande de débit de *${formatCdf(amount)}* envoyée sur *${mobilePhone}*.\n\nValidez le paiement avec votre code Mobile Money sur votre téléphone.\n\nRéf. *${payment.orderNumber}*\n\nVotre solde sera crédité automatiquement après confirmation.`
      );
      void reconcilePendingDeposits({ userId: user.id });
    } catch (err) {
      const msg =
        err instanceof SimplyPayeError
          ? err.message
          : "Impossible d'initier le paiement. Réessayez dans quelques instants.";
      replies.push(`❌ ${msg}`);
    }

    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "awaiting_withdrawal_amount") {
    const amount = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 1000) {
      replies.push("Montant minimum retrait : 1 000 CDF.");
      return persistMessages(user.id, text, replies).then(() => replies);
    }
    await setSession(user.id, "awaiting_mobile_money", { amount });
    replies.push("Entrez votre numéro Mobile Money (ex: +243XXXXXXXXX) :");
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "awaiting_mobile_money") {
    const amount = (session.context as { amount?: number })?.amount ?? 0;
    const phone = normalizePhone(text);
    const balance = parseFloat(user.balance);

    if (amount > balance) {
      await setSession(user.id, "idle");
      replies.push(`Solde insuffisant (${formatCdf(balance)}).`);
      return persistMessages(user.id, text, replies).then(() => replies);
    }

    const db = getDb();
    await db.insert(withdrawals).values({
      userId: user.id,
      amount: String(amount),
      mobileMoneyNumber: phone,
    });
    await db.update(users).set({ balance: String(balance - amount), updatedAt: new Date() }).where(eq(users.id, user.id));
    await setSession(user.id, "idle");
    await logUserNotification({
      userId: user.id,
      type: "withdrawal_requested",
      message: `Demande de retrait ${formatCdf(amount)} en attente de validation.`,
      sent: false,
    });
    replies.push(`✅ Demande de retrait de *${formatCdf(amount)}* enregistrée.\nValidation admin sous 24h.`);
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "quickbet_menu") {
    replies.push(await previewQuickBet(user.id, text.trim()));
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "quickbet_confirm") {
    const answer = text.trim().toLowerCase();
    if (answer === "1" || answer === "accepter" || answer === "oui") {
      replies.push(await placeQuickBetFromSession(user.id));
    } else if (answer === "2" || answer === "regenerer" || answer === "régénérer") {
      const ctx = session.context as { type?: string } | null;
      const typeChoice = ctx?.type === "safe" ? "1" : ctx?.type === "jackpot" ? "3" : ctx?.type === "custom" ? "4" : "2";
      replies.push(await previewQuickBet(user.id, typeChoice));
    } else if (answer === "annuler" || answer === "non") {
      await setSession(user.id, "idle");
      replies.push("QuickBet annulé.");
    } else {
      replies.push("Répondez *1* pour accepter, *2* pour régénérer ou *annuler*.");
    }
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  switch (resolvedCmd) {
    case "aide":
      replies.push(helpMessage());
      break;
    case "matchs":
      replies.push(await listMatches());
      break;
    case "solde":
      replies.push(`💰 Votre solde : *${formatCdf(activeUser.balance)}*`);
      break;
    case "depot":
      await setSession(user.id, "awaiting_deposit_amount");
      replies.push("Entrez le montant à déposer (min 500 CDF) :");
      break;
    case "retrait":
      await setSession(user.id, "awaiting_withdrawal_amount");
      replies.push("Entrez le montant à retirer (min 1 000 CDF) :");
      break;
    case "quick":
      await setSession(user.id, "quickbet_menu");
      replies.push(`⚡ *QuickBet*\n\n1. Ticket sûr\n2. Ticket équilibré\n3. Jackpot\n4. IA personnalisée\n\nRépondez 1, 2, 3 ou 4 :`);
      break;
    case "ticket": {
      const db = getDb();
      const userTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.userId, user.id))
        .orderBy(desc(tickets.createdAt))
        .limit(5);
      if (userTickets.length === 0) {
        replies.push("Aucun ticket. Tapez *quick* pour parier !");
      } else {
        let msg = "🎫 *VOS TICKETS*\n\n";
        userTickets.forEach((t) => {
          msg += `#${t.id.slice(0, 8)} | ${formatCdf(t.stake)} | ×${parseFloat(t.totalOdds).toFixed(2)} | ${t.status}\n`;
        });
        replies.push(msg);
      }
      break;
    }
    case "pari":
      replies.push("🎯 Construction de ticket — fonctionnalité complète bientôt disponible.\nUtilisez *quick* pour parier immédiatement.");
      break;
    default:
      if (isGreeting(text)) {
        replies.push(
          `Bonjour${message.name?.trim() ? ` ${message.name.trim()}` : ""} ! 👋\n\n${helpMessage()}`
        );
      } else {
        replies.push(helpMessage());
      }
  }

  return persistMessages(user.id, text, replies).then(() => replies);
}
