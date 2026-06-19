import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import express from "express";
import pino from "pino";
import qrcode from "qrcode-terminal";
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type proto,
} from "@whiskeysockets/baileys";
import { createHmac } from "crypto";
import { Boom } from "@hapi/boom";
import {
  ingestContactMapping,
  LidPhoneStore,
  resolveContactFromMessage,
  resolvePhoneForLid,
} from "./lid-phone.js";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

const logger = pino({ name: "gateway" });
const PORT = parseInt(process.env.GATEWAY_PORT ?? "3001", 10);
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/whatsapp";
const WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET ?? "dev-webhook-secret";
const SESSIONS_DIR = path.resolve(process.cwd(), "sessions");

type GatewayStatus = "open" | "connecting" | "close" | "disconnected";

let connectionStatus: GatewayStatus = "disconnected";
let currentQr: string | null = null;
let sock: WASocket | null = null;
let isStarting = false;
const messageStore = new Map<string, proto.IWebMessageInfo>();
const lidPhoneStore = new LidPhoneStore(SESSIONS_DIR);

function resolveTargetJid(phone: string, jid?: string | null) {
  if (jid) return jid;
  const digits = phone.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}

async function sendWhatsAppMessage(phone: string, text: string, jid?: string | null) {
  if (!sock || connectionStatus !== "open") {
    throw new Error("WhatsApp not connected");
  }
  const targetJid = resolveTargetJid(phone, jid);
  const sent = await sock.sendMessage(targetJid, { text });
  if (sent) storeMessage(sent);
  return sent;
}

async function fetchProfilePictureBase64(jid: string): Promise<string | null> {
  if (!sock || connectionStatus !== "open") return null;
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    const imgRes = await fetch(url);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function storeMessage(msg: proto.IWebMessageInfo) {
  const jid = msg.key.remoteJid;
  const id = msg.key.id;
  if (jid && id) messageStore.set(`${jid}:${id}`, msg);
}

async function forwardToApi(payload: object) {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, WEBHOOK_SECRET);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-whatsbet-signature": signature,
      },
      body,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      logger.error({ status: res.status, url: WEBHOOK_URL, body: errBody.slice(0, 200) }, "Webhook failed");
      return null;
    }

    return res.json();
  } catch (err) {
    logger.error({ err, url: WEBHOOK_URL }, "Webhook unreachable");
    return null;
  }
}

function bindSocketEvents(socket: WASocket, saveCreds: () => Promise<void>) {
  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("contacts.upsert", (contacts) => {
    for (const contact of contacts) ingestContactMapping(lidPhoneStore, contact);
  });

  socket.ev.on("contacts.update", (contacts) => {
    for (const contact of contacts) ingestContactMapping(lidPhoneStore, contact);
  });

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      connectionStatus = "connecting";
      logger.info("QR code ready — scan with WhatsApp");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      connectionStatus = "connecting";
    }

    if (connection === "open") {
      currentQr = null;
      connectionStatus = "open";
      isStarting = false;
      logger.info("WhatsApp connected");
    }

    if (connection === "close") {
      currentQr = null;
      connectionStatus = "close";
      isStarting = false;

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.info({ statusCode, shouldReconnect }, "Connection closed");

      if (shouldReconnect) {
        setTimeout(() => {
          startWhatsApp().catch((err) => logger.error(err, "Reconnect failed"));
        }, 3000);
      } else {
        connectionStatus = "disconnected";
      }
    }
  });

  socket.ev.on("messages.upsert", async ({ messages: msgs }) => {
    for (const msg of msgs) {
      storeMessage(msg);
      if (msg.key.fromMe || !msg.message) continue;

      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        "";

      if (!text) continue;

      const contact = await resolveContactFromMessage(socket, msg, lidPhoneStore);
      const name = msg.pushName;

      if (!contact.phone) {
        logger.warn({ jid: contact.whatsappJid, name }, "Could not resolve phone from LID");
      }

      try {
        const result = await forwardToApi({
          type: "message",
          data: {
            from: contact.phone,
            jid: contact.whatsappJid,
            name,
            text,
            messageId: msg.key.id ?? "",
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });

        const replies: string[] = result?.replies ?? [];
        for (const reply of replies) {
          const sent = await socket.sendMessage(
            msg.key.remoteJid!,
            { text: reply },
            { quoted: msg }
          );
          if (sent) storeMessage(sent);
        }
      } catch (err) {
        logger.error({ err, url: WEBHOOK_URL }, "Message handling error");
      }
    }
  });
}

async function startWhatsApp() {
  if (isStarting) return;
  isStarting = true;
  connectionStatus = "connecting";

  const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    syncFullHistory: false,
    getMessage: async (key) => {
      const jid = key.remoteJid;
      const id = key.id;
      if (!jid || !id) return undefined;
      return messageStore.get(`${jid}:${id}`);
    },
  });

  bindSocketEvents(sock, saveCreds);
}

async function resetSessionAndRestart() {
  if (sock) {
    try {
      sock.end(undefined);
    } catch {
      /* ignore */
    }
    sock = null;
  }

  currentQr = null;
  connectionStatus = "connecting";
  isStarting = false;

  if (fs.existsSync(SESSIONS_DIR)) {
    fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
  }

  await startWhatsApp();
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", whatsapp: connectionStatus });
});

app.get("/status", (_req, res) => {
  res.json({ status: connectionStatus });
});

app.get("/qr", (_req, res) => {
  res.json({ qr: currentQr });
});

app.post("/reconnect", async (_req, res) => {
  try {
    await resetSessionAndRestart();
    res.json({ ok: true, status: connectionStatus });
  } catch (err) {
    logger.error(err, "Manual reconnect failed");
    connectionStatus = "disconnected";
    isStarting = false;
    res.status(500).json({ error: "Reconnect failed" });
  }
});

app.post("/send", async (req, res) => {
  const { phone, jid, text } = req.body as { phone?: string; jid?: string; text?: string };
  if (!phone || !text?.trim()) {
    return res.status(400).json({ error: "phone and text required" });
  }
  try {
    const sent = await sendWhatsAppMessage(phone, text.trim(), jid);
    res.json({ ok: true, messageId: sent?.key.id ?? null });
  } catch (err) {
    logger.error(err, "Send failed");
    res.status(503).json({ error: err instanceof Error ? err.message : "Send failed" });
  }
});

app.get("/profile-picture", async (req, res) => {
  const jidParam = req.query.jid as string | undefined;
  const phoneParam = req.query.phone as string | undefined;
  let jid = jidParam;
  if (!jid && phoneParam) {
    const cached = phoneParam.startsWith("lid:") ? null : lidPhoneStore.getPnJid(phoneParam);
    jid = cached ?? resolveTargetJid(phoneParam);
  }
  if (!jid) return res.status(400).json({ error: "jid or phone required" });
  const base64 = await fetchProfilePictureBase64(jid);
  res.json({ base64 });
});

app.get("/resolve-phone", async (req, res) => {
  const jid = req.query.jid as string | undefined;
  if (!jid) return res.status(400).json({ error: "jid required" });
  if (!sock || connectionStatus !== "open") {
    return res.status(503).json({ error: "WhatsApp not connected" });
  }

  const phone = await resolvePhoneForLid(sock, jid, lidPhoneStore);
  return res.json({ phone, source: phone ? "resolved" : "unresolved" });
});

app.listen(PORT, () => {
  logger.info({ webhook: WEBHOOK_URL }, `Gateway listening on http://localhost:${PORT}`);
  startWhatsApp().catch((err) => {
    logger.error(err, "Failed to start WhatsApp");
    connectionStatus = "disconnected";
    isStarting = false;
  });
});
