import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3001";

export async function GET() {
  try {
    const [statusRes, healthRes] = await Promise.all([
      fetch(`${GATEWAY_URL}/status`, { cache: "no-store" }),
      fetch(`${GATEWAY_URL}/health`, { cache: "no-store" }),
    ]);

    const data = statusRes.ok ? await statusRes.json() : { status: "disconnected" };

    return NextResponse.json({
      status: data.status ?? "disconnected",
      gatewayRunning: healthRes.ok,
    });
  } catch (err) {
    console.error("Failed to fetch gateway status:", err);
    return NextResponse.json({ status: "disconnected", gatewayRunning: false });
  }
}
