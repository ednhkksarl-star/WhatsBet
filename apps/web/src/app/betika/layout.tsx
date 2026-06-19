import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function BetikaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "BETIKA") redirect("/dashboard");

  return (
    <AppShell userName={session.name} userRole="Partenaire Betika" readOnly>
      {children}
    </AppShell>
  );
}
