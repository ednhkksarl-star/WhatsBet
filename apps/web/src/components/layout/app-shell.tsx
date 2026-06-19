import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { eq, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { withdrawals } from "@whatsbet/database";

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  readOnly?: boolean;
}

async function getPendingCount() {
  try {
    const [row] = await getDb()
      .select({ count: count() })
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending"));
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function AppShell({ children, userName, userRole, readOnly }: AppShellProps) {
  const pendingCount = readOnly ? 0 : await getPendingCount();

  return (
    <div className="mesh-bg flex min-h-screen">
      <SidebarNav readOnly={readOnly} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userName={userName} userRole={userRole} readOnly={readOnly} pendingCount={pendingCount} />
        <main className="flex-1 overflow-auto p-6 lg:p-8 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
