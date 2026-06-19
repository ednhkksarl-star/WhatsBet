import path from "path";
import dotenv from "dotenv";
import express from "express";
import pino from "pino";
import qrcode from "qrcode-terminal";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { signPayload } from "@whatsbet/shared";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const logger = pino({ name: "gateway" });
const PORT = parseInt(process.env.GATEWAY_PORT ?? "3001", 10);
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/whatsapp";
const WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET ?? "dev-webhook-secret";

async function forwardToApi(payload: object) {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, WEBHOOK_SECRET);

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-whatsbet-signature": signature,
    },
    body,
  });

  if (!res.ok) {
    logger.error({ status: res.status }, "Webhook failed");
    return null;
  }

  return res.json();
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("./sessions");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info("Scan QR code:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.info({ statusCode, shouldReconnect }, "Connection closed");
      if (shouldReconnect) startWhatsApp();
    } else if (connection === "open") {
      logger.info("WhatsApp connected");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages: msgs }) => {
    for (const msg of msgs) {
      if (msg.key.fromMe || !msg.message) continue;

      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        "";

      if (!text) continue;

      const from = msg.key.remoteJid?.replace("@s.whatsapp.net", "") ?? "";
      const name = msg.pushName;

      try {
        const result = await forwardToApi({
          type: "message",
          data: {
            from: `+${from}`,
            name,
            text,
            messageId: msg.key.id ?? "",
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });

        const replies: string[] = result?.replies ?? [];
        for (const reply of replies) {
          await sock.sendMessage(msg.key.remoteJid!, { text: reply });
        }
      } catch (err) {
        logger.error(err, "Message handling error");
      }
    }
  });

  return sock;
}

const app = express();
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  logger.info(`Gateway listening on :${PORT}`);
  startWhatsApp().catch((err) => logger.error(err, "Failed to start WhatsApp"));
});
