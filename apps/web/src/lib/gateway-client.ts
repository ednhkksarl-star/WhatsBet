const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3001";

export async function gatewaySendMessage(payload: {
  phone: string;
  jid?: string | null;
  text: string;
}) {
  const res = await fetch(`${GATEWAY_URL}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Échec envoi WhatsApp");
  }
  return data as { ok: boolean; messageId?: string };
}

export async function gatewayFetchProfilePicture(payload: { phone: string; jid?: string | null }) {
  const params = new URLSearchParams();
  if (payload.jid) params.set("jid", payload.jid);
  else params.set("phone", payload.phone);

  const res = await fetch(`${GATEWAY_URL}/profile-picture?${params}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.base64 as string | null) ?? null;
}

export async function gatewayHealth() {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
