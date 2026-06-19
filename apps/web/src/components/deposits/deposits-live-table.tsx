"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle } from "lucide-react";
import { DetailSidePanel, SidePanelRow, SidePanelSection } from "@/components/ui/detail-side-panel";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";

type DepositRow = {
  id: string;
  phone: string;
  amount: string;
  reference: string | null;
  status: string;
  createdAt: string;
};

export function DepositsLiveTable({ initialRows }: { initialRows: DepositRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<DepositRow | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/deposits/feed", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rows)) setRows(data.rows);
      } catch {
        /* ignore */
      }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, []);

  if (rows.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="px-6 py-4">Joueur</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Référence</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((tx) => (
              <tr
                key={tx.id}
                className="cursor-pointer transition hover:bg-white/[0.04]"
                onClick={() => setSelected(tx)}
              >
                <td className="px-6 py-4 text-white">{tx.phone}</td>
                <td className="px-6 py-4 font-mono font-semibold text-success">{formatCdf(tx.amount)}</td>
                <td className="px-6 py-4 font-mono text-xs text-muted">{tx.reference ?? "—"}</td>
                <td className="px-6 py-4 text-muted">{new Date(tx.createdAt).toLocaleString("fr-FR")}</td>
                <td className="px-6 py-4">
                  <Badge status={tx.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailSidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Dépôt Mobile Money"
        subtitle={selected?.phone}
        icon={<ArrowDownCircle className="h-5 w-5 text-brand-yellow-500" />}
        badge={selected ? <Badge status={selected.status} /> : undefined}
      >
        {selected && (
          <SidePanelSection title="Transaction">
            <dl>
              <SidePanelRow label="Montant" value={formatCdf(selected.amount)} highlight />
              <SidePanelRow label="Joueur" value={selected.phone} mono />
              <SidePanelRow label="Référence" value={selected.reference ?? "—"} mono />
              <SidePanelRow label="Statut" value={<Badge status={selected.status} />} />
              <SidePanelRow
                label="Date"
                value={new Date(selected.createdAt).toLocaleString("fr-FR")}
              />
              <SidePanelRow label="ID" value={selected.id} mono />
            </dl>
          </SidePanelSection>
        )}
      </DetailSidePanel>
    </>
  );
}
