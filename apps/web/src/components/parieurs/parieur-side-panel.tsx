"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, MessageSquare, UserRound } from "lucide-react";
import { DetailSidePanel, SidePanelRow, SidePanelSection, SidePanelStats } from "@/components/ui/detail-side-panel";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { provinceLabel } from "@/lib/province-label";
import { formatCdf } from "@/lib/utils";
import type { Parieur } from "@/components/parieurs/parieurs-module";

type ParieurDetail = {
  parieur: Parieur & { city?: string | null };
  stats: {
    ticketsCount: number;
    ticketsVolume: number;
    depositsTotal: number;
    withdrawalsTotal: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
  recentTickets: Array<{
    id: string;
    stake: string;
    totalOdds: string;
    potentialWin: string;
    status: string;
    createdAt: string;
  }>;
};

function avatarSrc(base64: string | null | undefined) {
  if (!base64) return undefined;
  if (base64.startsWith("data:")) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

type ParieurSidePanelProps = {
  parieurId: string | null;
  onClose: () => void;
};

export function ParieurSidePanel({ parieurId, onClose }: ParieurSidePanelProps) {
  const [data, setData] = useState<ParieurDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/parieurs/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de chargement");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (parieurId) void load(parieurId);
    else setData(null);
  }, [parieurId, load]);

  const p = data?.parieur;

  return (
    <DetailSidePanel
      open={!!parieurId}
      onClose={onClose}
      title={p?.name ?? p?.phone ?? "Parieur"}
      subtitle={p?.phone}
      badge={p ? <Badge status={p.status} /> : undefined}
      icon={
        p ? (
          <Avatar name={p.name ?? p.phone} src={avatarSrc(p.profilePictureBase64)} size="sm" />
        ) : (
          <UserRound className="h-5 w-5 text-brand-yellow-500" />
        )
      }
      footer={
        parieurId ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/conversations?id=${parieurId}`} className="flex-1">
              <Button variant="secondary" className="w-full gap-2" size="sm">
                <MessageSquare className="h-4 w-4" />
                Conversation
              </Button>
            </Link>
            <Link href={`/dashboard/parieurs/${parieurId}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2" size="sm">
                <ExternalLink className="h-4 w-4" />
                Fiche complète
              </Button>
            </Link>
          </div>
        ) : undefined
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {data && p && !loading && (
        <>
          <SidePanelSection title="Résumé">
            <SidePanelStats
              items={[
                { label: "Solde", value: formatCdf(p.balance), accent: true },
                { label: "Tickets", value: String(data.stats.ticketsCount) },
                { label: "Volume parié", value: formatCdf(data.stats.ticketsVolume) },
                { label: "Dépôts", value: formatCdf(data.stats.depositsTotal) },
              ]}
            />
          </SidePanelSection>

          <SidePanelSection title="Profil">
            <dl>
              <SidePanelRow label="Téléphone" value={p.phone} mono />
              <SidePanelRow
                label="Province"
                value={p.province ? provinceLabel(p.province) : "Non renseignée"}
              />
              {p.city && <SidePanelRow label="Ville" value={p.city} />}
              <SidePanelRow
                label="Inscription"
                value={new Date(p.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              />
            </dl>
          </SidePanelSection>

          <SidePanelSection title="Transactions récentes">
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune transaction</p>
            ) : (
              <ul className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm capitalize text-white">{tx.type === "deposit" ? "Dépôt" : tx.type.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-brand-yellow-500">{formatCdf(tx.amount)}</p>
                      <Badge status={tx.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SidePanelSection>

          <SidePanelSection title="Tickets récents">
            {data.recentTickets.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun ticket</p>
            ) : (
              <ul className="space-y-3">
                {data.recentTickets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-slate-400">{t.id.slice(0, 8)}…</p>
                      <p className="text-[11px] text-slate-500">
                        ×{parseFloat(t.totalOdds).toFixed(2)} · {new Date(t.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-white">{formatCdf(t.stake)}</p>
                      <Badge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SidePanelSection>
        </>
      )}
    </DetailSidePanel>
  );
}
