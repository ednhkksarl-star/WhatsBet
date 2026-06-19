"use client";

import { useState } from "react";
import type { ProvinceStat } from "@/components/analytics/rdc-map";
import { RdcMap } from "@/components/analytics/rdc-map";

export function RdcMapPanel({ stats }: { stats: ProvinceStat[] }) {
  const [metric, setMetric] = useState<"volume" | "players" | "tickets" | "revenue">("volume");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["volume", "Volume paris"],
            ["revenue", "Recettes"],
            ["players", "Joueurs"],
            ["tickets", "Tickets"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMetric(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              metric === key ? "bg-brand-yellow-500 text-brand-blue-950" : "bg-white/5 text-muted hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <RdcMap stats={stats} metric={metric} />
    </div>
  );
}
