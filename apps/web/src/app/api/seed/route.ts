import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { admins } from "@whatsbet/database";
import { eq } from "drizzle-orm";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const db = getDb();
    const password = "WhatsBet2026!";
    const hash = await bcrypt.hash(password, 12);

    const seeds = [
      { email: "glody@whatsbet.cd", name: "Glody MUTOMBO", role: "SUPER_ADMIN" as const },
      { email: "admin@betika.cd", name: "Betika Admin", role: "BETIKA" as const },
    ];

    for (const seed of seeds) {
      const [existing] = await db.select().from(admins).where(eq(admins.email, seed.email)).limit(1);
      if (!existing) {
        await db.insert(admins).values({
          email: seed.email,
          name: seed.name,
          role: seed.role,
          passwordHash: hash,
        });
      }
    }

    return NextResponse.json({
      success: true,
      accounts: seeds.map((s) => ({ email: s.email, password: "WhatsBet2026!", role: s.role })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Seed failed — run db:push first" }, { status: 500 });
  }
}
