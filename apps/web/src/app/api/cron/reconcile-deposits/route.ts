import { NextRequest, NextResponse } from "next/server";
import { canWrite, getSession } from "@/lib/auth";
import { reconcilePendingDeposits } from "@/lib/deposits";

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

  const result = await reconcilePendingDeposits({ limit: 50 });
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
