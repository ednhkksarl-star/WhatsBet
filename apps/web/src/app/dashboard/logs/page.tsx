import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs } from "@whatsbet/database";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default async function LogsPage() {
  let rows: (typeof auditLogs.$inferSelect)[] = [];
  try {
    rows = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader title="Audit Log" description="Traçabilité complète des actions sur la plateforme" />

      {rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucun log" description="Les actions admin et système seront enregistrées ici." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Acteur</th>
                  <th className="px-6 py-4">IP</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((log) => (
                  <tr key={log.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-xs text-brand-yellow-500">{log.action}</td>
                    <td className="px-6 py-4 text-muted">{log.actorType}:{log.actorId?.slice(0, 8) ?? "—"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted">{log.ip ?? "—"}</td>
                    <td className="px-6 py-4 text-muted">{new Date(log.createdAt).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
