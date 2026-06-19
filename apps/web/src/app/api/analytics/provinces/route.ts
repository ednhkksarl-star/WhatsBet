import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProvinceStats } from "@/lib/analytics-provinces";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getProvinceStats();
  return NextResponse.json({ stats });
}
