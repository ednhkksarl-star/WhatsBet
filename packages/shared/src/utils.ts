import { createHmac, timingSafeEqual } from "crypto";

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function formatCdf(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${Math.round(num).toLocaleString("fr-FR")} CDF`;
}

export function formatOdds(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `×${num.toFixed(2)}`;
}

export function calculateTotalOdds(odds: number[]): number {
  return odds.reduce((acc, odd) => acc * odd, 1);
}

export function calculatePotentialWin(stake: number, totalOdds: number): number {
  return Math.round(stake * totalOdds * 100) / 100;
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("243")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+243${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

export const BOT_COMMANDS = [
  "pari",
  "matchs",
  "quick",
  "ticket",
  "solde",
  "depot",
  "retrait",
  "aide",
] as const;

export type BotCommand = (typeof BOT_COMMANDS)[number];

export function parseCommand(text: string): BotCommand | null {
  const cmd = text.trim().toLowerCase().split(/\s+/)[0];
  return BOT_COMMANDS.includes(cmd as BotCommand) ? (cmd as BotCommand) : null;
}
