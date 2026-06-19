import { NextRequest, NextResponse } from "next/server";
import { getSession, canManageStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { staffRoles, auditLogs } from "@whatsbet/database";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { ensureDefaultStaffRoles } from "@/lib/staff-seed";
import { ALL_STAFF_PERMISSIONS } from "@/lib/staff-permissions";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9_]+$/),
  description: z.string().max(500).optional(),
  adminRole: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "SUPPORT", "BETIKA"]),
  permissions: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultStaffRoles();
  const rows = await getDb().select().from(staffRoles).orderBy(desc(staffRoles.isSystem), staffRoles.name);
  return NextResponse.json({ roles: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.parse(await req.json());
  const permissions = body.permissions.filter((p) => ALL_STAFF_PERMISSIONS.includes(p as typeof ALL_STAFF_PERMISSIONS[number]));

  const db = getDb();
  const [created] = await db
    .insert(staffRoles)
    .values({
      name: body.name,
      slug: body.slug,
      description: body.description,
      adminRole: body.adminRole,
      permissions,
      isSystem: false,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "staff_role_created",
    payload: { roleId: created.id, slug: created.slug },
  });

  return NextResponse.json({ role: created });
}
