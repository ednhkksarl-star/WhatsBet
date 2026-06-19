import { eq } from "drizzle-orm";
import { isValidDisplayPhone, normalizePhone } from "@whatsbet/shared";
import { getDb } from "@/lib/db";
import { users } from "@whatsbet/database";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3001";

export async function syncUserPhoneFromGateway(userId: string): Promise<string | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.whatsappJid || isValidDisplayPhone(user.phone)) return user?.phone ?? null;

  try {
    const res = await fetch(
      `${GATEWAY_URL}/resolve-phone?jid=${encodeURIComponent(user.whatsappJid)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { phone?: string | null };
    if (!data.phone || !isValidDisplayPhone(data.phone)) return null;

    const validPhone = normalizePhone(data.phone);
    const [conflict] = await db.select().from(users).where(eq(users.phone, validPhone)).limit(1);
    if (conflict && conflict.id !== user.id) return null;

    await db
      .update(users)
      .set({ phone: validPhone, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return validPhone;
  } catch {
    return null;
  }
}

export async function syncInvalidUserPhones(userIds: string[]) {
  for (const id of userIds) {
    await syncUserPhoneFromGateway(id);
  }
}
