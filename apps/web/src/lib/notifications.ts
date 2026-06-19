import { getDb } from "@/lib/db";
import { notifications } from "@whatsbet/database";

export async function logUserNotification(params: {
  userId: string;
  type: string;
  message: string;
  sent?: boolean;
}) {
  const db = getDb();
  const sent = params.sent ?? true;
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    message: params.message,
    sent,
    sentAt: sent ? new Date() : undefined,
  });
}
