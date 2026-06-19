import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@whatsbet/database";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getDb().select().from(users).orderBy(desc(users.createdAt)).limit(5000);

  const header = ["id", "phone", "name", "balance", "status", "province", "created_at"];
  const lines = [header.join(",")];

  for (const u of rows) {
    lines.push(
      [u.id, u.phone, u.name ?? "", u.balance, u.status, u.province ?? "", u.createdAt.toISOString()]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
