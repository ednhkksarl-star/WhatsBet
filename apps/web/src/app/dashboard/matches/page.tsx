import { desc, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { matches } from "@whatsbet/database";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MatchesPage() {
  let rows: (typeof matches.$inferSelect)[] = [];
  try {
    const now = new Date();
    now.setHours(now.getHours() - 24);
    rows = await getDb().select().from(matches).where(gte(matches.startTime, now)).orderBy(desc(matches.startTime)).limit(50);
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader
        title="Matchs"
        description="Matchs synchronisés depuis The Odds API"
        action={<form action="/api/cron/sync-odds" method="GET"><Button variant="secondary" size="sm" type="submit">Sync maintenant</Button></form>}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Trophy} title="Aucun match" description="Lancez la synchronisation Odds API pour importer les matchs et cotes du jour." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Match</th>
                  <th className="px-6 py-4">Ligue</th>
                  <th className="px-6 py-4">Début</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((m) => (
                  <tr key={m.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">{m.homeTeam} <span className="text-muted">vs</span> {m.awayTeam}</td>
                    <td className="px-6 py-4 text-muted">{m.league}</td>
                    <td className="px-6 py-4 text-muted">{new Date(m.startTime).toLocaleString("fr-FR")}</td>
                    <td className="px-6 py-4"><Badge status={m.status} /></td>
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
