import fs from "fs";
import path from "path";
import {
  isLidUser,
  jidNormalizedUser,
  USyncQuery,
  USyncUser,
  type WASocket,
  type proto,
  type WAMessageKey,
} from "@whiskeysockets/baileys";

const PN_SUFFIXES = ["@s.whatsapp.net", "@c.us"];

export function isPnJid(jid: string): boolean {
  return PN_SUFFIXES.some((suffix) => jid.endsWith(suffix));
}

export function phoneFromPnJid(jid: string): string | null {
  const user = jid.split("@")[0]?.split(":")[0] ?? "";
  const digits = user.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.startsWith("243")) return `+${digits}`;
  if (digits.startsWith("0")) return `+243${digits.slice(1)}`;
  return `+${digits}`;
}

export function lidPlaceholderPhone(lidJid: string): string {
  const user = lidJid.split("@")[0] ?? lidJid;
  return `lid:${user}`.slice(0, 32);
}

export class LidPhoneStore {
  private map = new Map<string, string>();
  private filePath: string;

  constructor(sessionsDir: string) {
    this.filePath = path.join(sessionsDir, "lid-phone-map.json");
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const raw = JSON.parse(fs.readFileSync(this.filePath, "utf-8")) as Record<string, string>;
      for (const [lid, pn] of Object.entries(raw)) {
        this.map.set(lid, pn);
      }
    } catch {
      /* ignore corrupt cache */
    }
  }

  private persist() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(Object.fromEntries(this.map), null, 2));
    } catch {
      /* ignore write errors */
    }
  }

  set(lidJid: string, pnJid: string) {
    const lid = jidNormalizedUser(lidJid);
    const pn = jidNormalizedUser(pnJid);
    if (!isLidUser(lid) || !isPnJid(pn)) return;
    this.map.set(lid, pn);
    this.persist();
  }

  getPnJid(lidJid: string): string | null {
    return this.map.get(jidNormalizedUser(lidJid)) ?? null;
  }
}

function pnFromMessageKey(key: WAMessageKey): string | null {
  const candidates = [key.senderPn, key.participantPn].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const normalized = candidate.includes("@") ? candidate : `${candidate.replace(/\D/g, "")}@s.whatsapp.net`;
    const phone = phoneFromPnJid(normalized);
    if (phone) return phone;
  }
  return null;
}

async function pnFromUsync(socket: WASocket, lidJid: string, store: LidPhoneStore): Promise<string | null> {
  try {
    const usyncQuery = new USyncQuery().withContactProtocol().withLIDProtocol();
    usyncQuery.withUser(new USyncUser().withId(lidJid));
    const results = await socket.executeUSyncQuery(usyncQuery);
    const entry = results?.list?.[0] as { id?: string; lid?: string } | undefined;
    if (!entry?.id) return null;

    if (isPnJid(entry.id)) {
      store.set(lidJid, entry.id);
      return phoneFromPnJid(entry.id);
    }
  } catch {
    return null;
  }
  return null;
}

export async function resolvePhoneForLid(
  socket: WASocket,
  lidJid: string,
  store: LidPhoneStore
): Promise<string | null> {
  const cachedPnJid = store.getPnJid(lidJid);
  if (cachedPnJid) {
    const phone = phoneFromPnJid(cachedPnJid);
    if (phone) return phone;
  }

  const fromSignal = await pnFromSignalStore(socket, lidJid);
  if (fromSignal) {
    store.set(lidJid, `${fromSignal.replace(/\D/g, "")}@s.whatsapp.net`);
    return fromSignal;
  }

  return pnFromUsync(socket, lidJid, store);
}

async function pnFromSignalStore(socket: WASocket, lidJid: string): Promise<string | null> {
  const repo = (socket as unknown as { signalRepository?: { lidMapping?: { getPNForLID?: (lid: string) => Promise<string | null> | string | null } } }).signalRepository;
  const getPNForLID = repo?.lidMapping?.getPNForLID;
  if (!getPNForLID) return null;
  try {
    const pnJid = await getPNForLID(lidJid);
    if (!pnJid) return null;
    return phoneFromPnJid(pnJid);
  } catch {
    return null;
  }
}

export async function resolveContactFromMessage(
  socket: WASocket,
  msg: proto.IWebMessageInfo,
  store: LidPhoneStore
): Promise<{ whatsappJid: string; phone: string | null; pnJid: string | null }> {
  const key = msg.key as WAMessageKey;
  const remoteJid = key.remoteJid ?? "";

  const pnFromKey = pnFromMessageKey(key);
  if (pnFromKey && isLidUser(remoteJid)) {
    store.set(remoteJid, `${pnFromKey.replace(/\D/g, "")}@s.whatsapp.net`);
  }

  if (isPnJid(remoteJid)) {
    const phone = phoneFromPnJid(remoteJid);
    return { whatsappJid: remoteJid, phone, pnJid: remoteJid };
  }

  if (isLidUser(remoteJid)) {
    if (pnFromKey) {
      const pnJid = `${pnFromKey.replace(/\D/g, "")}@s.whatsapp.net`;
      return { whatsappJid: remoteJid, phone: pnFromKey, pnJid };
    }

    const cachedPnJid = store.getPnJid(remoteJid);
    if (cachedPnJid) {
      const phone = phoneFromPnJid(cachedPnJid);
      if (phone) return { whatsappJid: remoteJid, phone, pnJid: cachedPnJid };
    }

    const fromSignal = await pnFromSignalStore(socket, remoteJid);
    if (fromSignal) {
      store.set(remoteJid, `${fromSignal.replace(/\D/g, "")}@s.whatsapp.net`);
      return {
        whatsappJid: remoteJid,
        phone: fromSignal,
        pnJid: `${fromSignal.replace(/\D/g, "")}@s.whatsapp.net`,
      };
    }

    const fromUsync = await pnFromUsync(socket, remoteJid, store);
    if (fromUsync) {
      return {
        whatsappJid: remoteJid,
        phone: fromUsync,
        pnJid: `${fromUsync.replace(/\D/g, "")}@s.whatsapp.net`,
      };
    }

    return { whatsappJid: remoteJid, phone: null, pnJid: null };
  }

  const fallback = phoneFromPnJid(jidNormalizedUser(remoteJid));
  return { whatsappJid: remoteJid, phone: fallback, pnJid: null };
}

export function ingestContactMapping(
  store: LidPhoneStore,
  contact: { id?: string; lid?: string; jid?: string }
) {
  const lid = contact.lid ?? (contact.id && isLidUser(contact.id) ? contact.id : null);
  const pn = contact.jid ?? (contact.id && isPnJid(contact.id) ? contact.id : null);
  if (lid && pn) store.set(lid, pn);
}
