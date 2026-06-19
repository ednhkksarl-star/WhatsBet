import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureProfilePicture } from "@/lib/conversations";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const base64 = await ensureProfilePicture(userId);
  return NextResponse.json({ base64 });
}
