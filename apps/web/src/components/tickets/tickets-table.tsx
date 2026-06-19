"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { DetailSidePanel, SidePanelRow, SidePanelSection } from "@/components/ui/detail-side-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";
import { formatCdf } from "@/lib/utils";

export type TicketRow = {
  id: string;
  stake: string;
  totalOdds: string;
  potentialWin: string;
  status: string;
  isQuickBet: boolean | null;
  createdAt: string;
  userPhone: string | null;
};

export function TicketsTable({ rows }: { rows: TicketRow[] }) {
  const [selected, setSelected] = useState<TicketRow | null>(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="Aucun ticket"
        description="Les tickets apparaîtront ici dès que les joueurs commenceront à parier via WhatsApp."
      />
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Joueur</th>
                <th className="px-6 py-4">Mise</th>
                <th className="px-6 py-4">Cote</th>
                <th className="px-6 py-4">Gain pot.</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer transition hover:bg-white/[0.04]"
                  onClick={() => setSelected(row)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-muted">{row.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-white">{row.userPhone ?? "—"}</td>
                  <td className="px-6 py-4">{formatCdf(row.stake)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-yellow-500">
                    ×{parseFloat(row.totalOdds).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">{formatCdf(row.potentialWin)}</td>
                  <td className="px-6 py-4">
                    {row.isQuickBet ? (
                      <span className="rounded-full bg-brand-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-yellow-500">
                        QuickBet
                      </span>
                    ) : (
                      <span className="text-muted">Manuel</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DetailSidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Ticket ${selected?.id.slice(0, 8) ?? ""}`}
        subtitle={selected?.userPhone ?? undefined}
        icon={<Ticket className="h-5 w-5 text-brand-yellow-500" />}
        badge={selected ? <Badge status={selected.status} /> : undefined}
      >
        {selected && (
          <>
            <SidePanelSection title="Paris">
              <dl>
                <SidePanelRow label="ID complet" value={selected.id} mono />
                <SidePanelRow label="Mise" value={formatCdf(selected.stake)} highlight />
                <SidePanelRow label="Cote totale" value={`×${parseFloat(selected.totalOdds).toFixed(2)}`} mono />
                <SidePanelRow label="Gain potentiel" value={formatCdf(selected.potentialWin)} highlight />
                <SidePanelRow
                  label="Type"
                  value={selected.isQuickBet ? "QuickBet IA" : "Manuel"}
                />
                <SidePanelRow
                  label="Créé le"
                  value={new Date(selected.createdAt).toLocaleString("fr-FR")}
                />
              </dl>
            </SidePanelSection>
          </>
        )}
      </DetailSidePanel>
    </>
  );
}
