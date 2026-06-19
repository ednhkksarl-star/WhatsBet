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
} from "@whatsbet/database";
import {
  parseCommand,
  normalizePhone,
  formatCdf,
  BetEngine,
  QuickBetEngine,
} from "@whatsbet/shared";
import type { WhatsAppInboundMessage } from "@whatsbet/types";

async function getOrCreateUser(phone: string, name?: string) {
  const db = getDb();
  const normalized = normalizePhone(phone);
  const [existing] = await db.select().from(users).where(eq(users.phone, normalized)).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ phone: normalized, name: name ?? undefined })
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

Commandes disponibles :
• *matchs* — Voir les matchs du jour
• *pari* — Construire un ticket
• *quick* — QuickBet (sûr/équilibré/jackpot/IA)
• *ticket* — Vos tickets
• *solde* — Votre solde
• *depot* — Déposer de l'argent
• *retrait* — Retirer de l'argent
• *aide* — Ce menu`;
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

  if (rows.length === 0) return "Aucun match disponible pour le moment.";

  let msg = "🏟 *MATCHS DU JOUR*\n\n";
  rows.forEach((m, i) => {
    msg += `${i + 1}. *${m.homeTeam}* vs *${m.awayTeam}*\n   🕐 ${new Date(m.startTime).toLocaleString("fr-FR")} | ${m.league}\n\n`;
  });
  msg += "⚡ *quick* pour QuickBet\n💰 *solde* pour votre solde";
  return msg;
}

async function handleQuickBet(userId: string, choice?: string): Promise<string> {
  const db = getDb();
  const stake = 5000;

  const availableOdds = await db
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
    .where(and(eq(odds.isActive, true), eq(matches.status, "scheduled")))
    .limit(100);

  const mapped = availableOdds.map((o) => ({
    ...o,
    oddValue: parseFloat(o.oddValue),
  }));

  if (mapped.length === 0) return "Aucune cote disponible. Réessayez plus tard.";

  const typeMap: Record<string, "safe" | "balanced" | "jackpot" | "custom"> = {
    "1": "safe",
    "2": "balanced",
    "3": "jackpot",
    "4": "custom",
  };

  const type = typeMap[choice ?? "2"] ?? "balanced";

  try {
    const selections = QuickBetEngine.generate(type, mapped, stake, 3);
    const ticket = BetEngine.build({ userId, stake, selections });

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || parseFloat(user.balance) < stake) {
      return `Solde insuffisant. Mise requise : ${formatCdf(stake)}. Tapez *depot* pour recharger.`;
    }

    const [created] = await db
      .insert(tickets)
      .values({
        userId,
        stake: String(stake),
        totalOdds: String(ticket.totalOdds),
        potentialWin: String(ticket.potentialWin),
        isQuickBet: true,
        quickBetType: type,
      })
      .returning();

    for (const sel of selections) {
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

    let msg = `⚡ *QuickBet ${type.toUpperCase()}*\n\n`;
    selections.forEach((s, i) => {
      const match = mapped.find((m) => m.matchId === s.matchId);
      msg += `${i + 1}. ${match?.homeTeam} vs ${match?.awayTeam} → ${s.selection} (×${s.oddValue.toFixed(2)})\n`;
    });
    msg += `\n💰 Mise : ${formatCdf(stake)}\n📊 Cote totale : ×${ticket.totalOdds.toFixed(2)}\n🎯 Gain potentiel : ${formatCdf(ticket.potentialWin)}`;
    return msg;
  } catch (e) {
    return e instanceof Error ? e.message : "Erreur QuickBet";
  }
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
  const user = await getOrCreateUser(message.from, message.name);
  const text = message.text.trim();

  if (user.status === "blocked") {
    return persistMessages(user.id, text, ["❌ Votre compte est bloqué. Contactez le support."]).then(() => ["❌ Votre compte est bloqué. Contactez le support."]);
  }
  const cmd = parseCommand(text);
  const session = await getSession(user.id);

  if (session?.step === "awaiting_deposit_amount") {
    const amount = parseInt(text.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 500) {
      replies.push("Montant minimum : 500 CDF. Réessayez.");
      return persistMessages(user.id, text, replies).then(() => replies);
    }
    await setSession(user.id, "idle");
    const payUrl = process.env.SIMPLYPAYE_MOBILE_URL ?? "https://simplypaye.com/pay";
    replies.push(`💳 Déposez *${formatCdf(amount)}* via SimplyPaye :\n${payUrl}?amount=${amount}&phone=${user.phone}`);
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
    replies.push(`✅ Demande de retrait de *${formatCdf(amount)}* enregistrée.\nValidation admin sous 24h.`);
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  if (session?.step === "quickbet_menu") {
    replies.push(await handleQuickBet(user.id, text.trim()));
    await setSession(user.id, "idle");
    return persistMessages(user.id, text, replies).then(() => replies);
  }

  switch (cmd) {
    case "aide":
      replies.push(helpMessage());
      break;
    case "matchs":
      replies.push(await listMatches());
      break;
    case "solde":
      replies.push(`💰 Votre solde : *${formatCdf(user.balance)}*`);
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
      replies.push(helpMessage());
  }

  return persistMessages(user.id, text, replies).then(() => replies);
}
