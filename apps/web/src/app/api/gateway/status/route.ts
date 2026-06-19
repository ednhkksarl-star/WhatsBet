import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3001";

export async function GET() {
  try {
    const response = await fetch(`${GATEWAY_URL}/status`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch gateway status:", err);
    return NextResponse.json({ status: "disconnected" });
  }
}
