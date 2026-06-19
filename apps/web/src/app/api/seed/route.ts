import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { ensureDefaultStaffRoles } from "@/lib/staff-seed";
import { admins, staffRoles } from "@whatsbet/database";
import { eq } from "drizzle-orm";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const db = getDb();
    await ensureDefaultStaffRoles();
    const password = "WhatsBet2026!";
    const hash = await bcrypt.hash(password, 12);

    const seeds = [
      { email: "glody@whatsbet.cd", name: "Glody MUTOMBO", role: "SUPER_ADMIN" as const, slug: "super_admin" },
      { email: "admin@betika.cd", name: "Betika Admin", role: "BETIKA" as const, slug: "betika" },
    ];

    for (const seed of seeds) {
      const [roleRow] = await db.select().from(staffRoles).where(eq(staffRoles.slug, seed.slug)).limit(1);
      const [existing] = await db.select().from(admins).where(eq(admins.email, seed.email)).limit(1);
      if (!existing) {
        await db.insert(admins).values({
          email: seed.email,
          name: seed.name,
          role: seed.role,
          staffRoleId: roleRow?.id,
          passwordHash: hash,
        });
      } else if (!existing.staffRoleId && roleRow) {
        await db.update(admins).set({ staffRoleId: roleRow.id, updatedAt: new Date() }).where(eq(admins.id, existing.id));
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
