"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Percent,
  Ticket,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const STAT_ICONS = {
  users: Users,
  ticket: Ticket,
  trendingUp: TrendingUp,
  arrowDownCircle: ArrowDownCircle,
  arrowUpCircle: ArrowUpCircle,
  percent: Percent,
  wallet: Wallet,
  barChart3: BarChart3,
  trophy: Trophy,
} as const satisfies Record<string, LucideIcon>;

export type StatIconName = keyof typeof STAT_ICONS;

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: StatIconName;
  index?: number;
}

export function StatCard({ title, value, change, changeType = "neutral", icon, index = 0 }: StatCardProps) {
  const Icon = STAT_ICONS[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-yellow-500/5 blur-2xl transition group-hover:bg-brand-yellow-500/10" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-800/60 ring-1 ring-white/10">
            <Icon className="h-5 w-5 text-brand-yellow-500" />
          </div>
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                changeType === "positive" && "bg-success/10 text-success",
                changeType === "negative" && "bg-error/10 text-error",
                changeType === "neutral" && "bg-white/5 text-muted"
              )}
            >
              {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
              {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
              {change}
            </span>
          )}
        </div>
        <p className="text-sm text-muted">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-white">{value}</p>
      </div>
    </motion.div>
  );
}
