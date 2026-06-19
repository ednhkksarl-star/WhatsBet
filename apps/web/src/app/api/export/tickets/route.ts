import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { tickets, users } from "@whatsbet/database";
import { eq } from "drizzle-orm";

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

  const rows = await getDb()
    .select({ ticket: tickets, user: users })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .orderBy(desc(tickets.createdAt))
    .limit(5000);

  const header = ["id", "phone", "stake", "total_ods", "potential_win", "status", "is_quickbet", "created_at"];
  const lines = [header.join(",")];

  for (const { ticket, user } of rows) {
    lines.push(
      [
        ticket.id,
        user?.phone ?? "",
        ticket.stake,
        ticket.totalOdds,
        ticket.potentialWin,
        ticket.status,
        String(ticket.isQuickBet),
        ticket.createdAt.toISOString(),
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
