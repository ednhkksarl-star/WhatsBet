import { redirect } from "next/navigation";
import { getSession, canManageStaff } from "@/lib/auth";
import { StaffModule } from "@/components/staff/staff-module";

export default async function StaffPage() {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    redirect("/dashboard");
  }

  return <StaffModule />;
}
