import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, canManageStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { admins, staffRoles, auditLogs } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  staffRoleId: z.string().uuid().optional(),
  avatarBase64: z.string().max(500_000).optional().nullable(),
  status: z.enum(["active", "disabled"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = updateSchema.parse(await req.json());
  const db = getDb();

  const [existing] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }

  const updates: Partial<typeof admins.$inferInsert> = { updatedAt: new Date() };
  if (body.name) updates.name = body.name;
  if (body.email && body.email !== existing.email) {
    const [conflict] = await db.select().from(admins).where(eq(admins.email, body.email)).limit(1);
    if (conflict && conflict.id !== id) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }
    updates.email = body.email;
  }
  if (body.password) updates.passwordHash = await bcrypt.hash(body.password, 12);
  if (body.avatarBase64 !== undefined) updates.avatarBase64 = body.avatarBase64 ?? null;
  if (body.status) updates.status = body.status;

  if (body.staffRoleId) {
    const [role] = await db.select().from(staffRoles).where(eq(staffRoles.id, body.staffRoleId)).limit(1);
    if (!role) {
      return NextResponse.json({ error: "Rôle introuvable" }, { status: 400 });
    }
    updates.staffRoleId = role.id;
    updates.role = role.adminRole;
  }

  const [updated] = await db.update(admins).set(updates).where(eq(admins.id, id)).returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "staff_member_updated",
    payload: { memberId: id },
  });

  return NextResponse.json({
    member: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      staffRoleId: updated.staffRoleId,
      avatarBase64: updated.avatarBase64,
      status: updated.status,
      twoFactorEnabled: updated.twoFactorEnabled,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (id === session.adminId) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }

  await db.delete(admins).where(eq(admins.id, id));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "staff_member_deleted",
    payload: { memberId: id, email: existing.email },
  });

  return NextResponse.json({ success: true });
}
