import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3001";

export async function POST() {
  try {
    const response = await fetch(`${GATEWAY_URL}/reconnect`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({ error: data.error ?? "Reconnect failed" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to reconnect gateway:", err);
    return NextResponse.json({ error: "Gateway unreachable — lancez pnpm dev:gateway" }, { status: 503 });
  }
}
