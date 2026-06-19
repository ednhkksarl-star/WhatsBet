import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@whatsbet/database";
import { isValidDisplayPhone } from "@whatsbet/shared";
import { gatewayFetchProfilePicture } from "@/lib/gateway-client";

export { isValidDisplayPhone };

export function formatDisplayPhone(phone: string, jid?: string | null): string {
  if (phone.startsWith("lid:")) {
    if (isValidDisplayPhone(phone.slice(4))) return normalizeLegacyPhone(phone.slice(4));
  }
  if (isValidDisplayPhone(phone)) return phone;
  if (jid?.includes("@")) {
    const user = jid.split("@")[0] ?? jid;
    if (jid.endsWith("@lid")) return `WhatsApp · ${user.slice(0, 8)}…`;
  }
  return phone || "—";
}

function normalizeLegacyPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("243")) return `+${digits}`;
  return `+${digits}`;
}

export async function ensureProfilePicture(userId: string): Promise<string | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  if (user.profilePictureBase64) return user.profilePictureBase64;

  const base64 = await gatewayFetchProfilePicture({
    phone: user.phone,
    jid: user.whatsappJid,
  });
  if (!base64) return null;

  await db
    .update(users)
    .set({ profilePictureBase64: base64, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return base64;
}
