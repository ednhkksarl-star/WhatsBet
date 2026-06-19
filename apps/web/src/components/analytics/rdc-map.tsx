"use client";

import { useMemo, useState } from "react";
import { RDC_PROVINCES } from "@/data/rdc-provinces";
import { cn } from "@/lib/utils";
import { formatCdf } from "@/lib/utils";

export interface ProvinceStat {
  id: string;
  name: string;
  players: number;
  tickets: number;
  volume: number;
  revenue: number;
}

interface RdcMapProps {
  stats: ProvinceStat[];
  metric?: "volume" | "players" | "tickets" | "revenue";
}

function heatColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "#DDE4EC";
  const t = Math.min(1, value / max);
  if (t < 0.25) return `rgba(7, 94, 84, ${0.35 + t})`;
  if (t < 0.5) return `rgba(234, 179, 8, ${0.45 + t * 0.4})`;
  if (t < 0.75) return `rgba(234, 88, 12, ${0.55 + t * 0.3})`;
  return `rgba(185, 28, 28, ${0.65 + t * 0.25})`;
}

export function RdcMap({ stats, metric = "volume" }: RdcMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const statMap = useMemo(() => new Map(stats.map((s) => [s.id, s])), [stats]);
  const maxValue = useMemo(() => {
    const values = stats.map((s) => s[metric] ?? 0);
    return Math.max(...values, 1);
  }, [stats, metric]);

  const activeId = selected ?? hovered;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="relative flex min-h-0 flex-1 flex-col rounded-2xl border border-white/5 bg-brand-blue-950/40 p-1 sm:p-1.5">
        <div className="relative h-[340px] sm:h-[420px]">
          <svg
            viewBox="0 0 733 724"
            className="mx-auto h-full w-full max-w-none"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Carte des provinces de la RDC"
          >
            {RDC_PROVINCES.map((p) => {
              const stat = statMap.get(p.id);
              const value = stat?.[metric] ?? 0;
              const isActive = activeId === p.id;
              return (
                <g key={p.id}>
                  <path
                    id={p.id}
                    d={p.path}
                    fill={heatColor(value, maxValue)}
                    fillOpacity={isActive ? 1 : 0.88}
                    stroke={isActive ? "#075E54" : "#FFFFFF"}
                    strokeWidth={isActive ? 2 : 1}
                    className="cursor-pointer transition-[fill-opacity,stroke-width] duration-150"
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(selected === p.id ? null : p.id)}
                  >
                    <title>
                      {p.name}
                      {stat ? ` — ${value}` : ""}
                    </title>
                  </path>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 px-2 pb-2 text-[10px] text-muted">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-[#DDE4EC]" /> Faible</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-brand-green-600/60" /> Moyen</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-amber-500/70" /> Élevé</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-red-700/80" /> Très élevé</span>
        </div>
      </div>

      <div className="w-full shrink-0 rounded-2xl border border-white/5 bg-white/[0.02] p-4 lg:w-72">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Province</p>
        {activeId ? (
          (() => {
            const prov = RDC_PROVINCES.find((p) => p.id === activeId);
            const stat = statMap.get(activeId);
            return (
              <div className="mt-3">
                <h3 className="text-lg font-bold text-white">{prov?.name ?? activeId}</h3>
                {stat ? (
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Joueurs</dt><dd className="font-mono text-white">{stat.players}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Tickets</dt><dd className="font-mono text-white">{stat.tickets}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Volume paris</dt><dd className="font-mono text-brand-yellow-500">{formatCdf(stat.volume)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Recettes (dépôts)</dt><dd className="font-mono text-emerald-400">{formatCdf(stat.revenue)}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted">Aucune donnée pour cette province dans le dernier rapport.</p>
                )}
              </div>
            );
          })()
        ) : (
          <p className="mt-3 text-sm text-muted">Survolez ou cliquez une province pour voir les statistiques.</p>
        )}

        <div className="mt-6 border-t border-white/5 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Top provinces</p>
          <ul className="space-y-2">
            {[...stats].sort((a, b) => b[metric] - a[metric]).slice(0, 5).map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-white/5",
                    selected === s.id && "bg-white/5"
                  )}
                >
                  <span className="text-white">{i + 1}. {s.name}</span>
                  <span className="font-mono text-xs text-muted">{metric === "volume" || metric === "revenue" ? formatCdf(s[metric]) : s[metric]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
