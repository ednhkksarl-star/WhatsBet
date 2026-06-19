import { getDb } from "@/lib/db";
import { staffRoles } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { DEFAULT_STAFF_ROLES } from "@/lib/staff-permissions";

export async function ensureDefaultStaffRoles() {
  const db = getDb();
  for (const role of DEFAULT_STAFF_ROLES) {
    const [existing] = await db.select().from(staffRoles).where(eq(staffRoles.slug, role.slug)).limit(1);
    if (!existing) {
      await db.insert(staffRoles).values({
        name: role.name,
        slug: role.slug,
        description: role.description,
        permissions: role.permissions,
        adminRole: role.adminRole,
        isSystem: role.isSystem,
      });
    }
  }
}
