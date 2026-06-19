import { NextRequest, NextResponse } from "next/server";
import { canWrite, getSession } from "@/lib/auth";
import { syncOddsFromApi } from "@/lib/sync-odds";

function isCronAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function isAdminAuthorized() {
  const session = await getSession();
  return Boolean(session && canWrite(session.role));
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req) && !(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { synced } = await syncOddsFromApi();
    return NextResponse.json({ success: true, synced });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const status = message.includes("THE_ODDS_API_KEY") ? 500 : 502;
    console.error("Sync error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
