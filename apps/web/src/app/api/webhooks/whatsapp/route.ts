import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@whatsbet/shared";
import { handleWhatsAppMessage } from "@/lib/bot/handler";

export async function POST(req: NextRequest) {
  const secret = process.env.GATEWAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-whatsbet-signature") ?? "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.type === "message" && payload.data?.from) {
    const replies = await handleWhatsAppMessage(payload.data);
    return NextResponse.json({ success: true, replies });
  }

  return NextResponse.json({ success: true });
}
