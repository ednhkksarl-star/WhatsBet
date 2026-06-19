import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@whatsbet/database";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/page-header";
import { formatCdf } from "@/lib/utils";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function UsersPage() {
  let rows: (typeof users.$inferSelect)[] = [];
  try {
    rows = await getDb().select().from(users).orderBy(desc(users.createdAt)).limit(50);
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader title="Utilisateurs" description={`${rows.length} joueurs enregistrés`} badge={`${rows.filter((u) => u.status === "active").length} actifs`} />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Les joueurs seront créés automatiquement à leur premier message WhatsApp." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Joueur</th>
                  <th className="px-6 py-4">Téléphone</th>
                  <th className="px-6 py-4">Solde</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Inscrit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((u) => (
                  <tr key={u.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/conversations/${u.id}`} className="flex items-center gap-3 hover:text-brand-yellow-500">
                        <Avatar name={u.name ?? u.phone} size="sm" />
                        <span className="font-medium text-white">{u.name ?? "—"}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted">{u.phone}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-brand-yellow-500">{formatCdf(u.balance)}</td>
                    <td className="px-6 py-4"><Badge status={u.status} /></td>
                    <td className="px-6 py-4 text-muted">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
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
