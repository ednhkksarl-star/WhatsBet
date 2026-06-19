import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "BETIKA") redirect("/betika");

  return (
    <AppShell userName={session.name} userRole="Super Admin">
      {children}
    </AppShell>
  );
}
