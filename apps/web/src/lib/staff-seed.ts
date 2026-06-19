import { getDb } from "@/lib/db";
import { staffRoles } from "@whatsbet/database";
import { DEFAULT_STAFF_ROLES } from "@/lib/staff-permissions";

let seeding: Promise<void> | null = null;

async function seedDefaultStaffRoles() {
  const db = getDb();
  for (const role of DEFAULT_STAFF_ROLES) {
    await db
      .insert(staffRoles)
      .values({
        name: role.name,
        slug: role.slug,
        description: role.description,
        permissions: role.permissions,
        adminRole: role.adminRole,
        isSystem: role.isSystem,
      })
      .onConflictDoNothing({ target: staffRoles.slug });
  }
}

/** Idempotent seed — safe under concurrent API calls (members + roles in parallel). */
export async function ensureDefaultStaffRoles() {
  if (!seeding) {
    seeding = seedDefaultStaffRoles().finally(() => {
      seeding = null;
    });
  }
  await seeding;
}
