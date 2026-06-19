"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Ticket,
  ArrowDownCircle,
  ArrowUpCircle,
  Trophy,
  ScrollText,
  LogOut,
  MessageSquare,
  Settings,
  BarChart3,
  Wallet,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavGroup {
  label: string;
  items: { href: string; icon: React.ElementType; label: string; betikaHidden?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Vue d'ensemble",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/dashboard/finance", icon: Wallet, label: "Finance" },
    ],
  },
  {
    label: "Opérations",
    items: [
      { href: "/dashboard/users", icon: Users, label: "Utilisateurs" },
      { href: "/dashboard/tickets", icon: Ticket, label: "Tickets" },
      { href: "/dashboard/conversations", icon: MessageSquare, label: "Conversations" },
      { href: "/dashboard/withdrawals", icon: ArrowUpCircle, label: "Retraits", betikaHidden: true },
      { href: "/dashboard/deposits", icon: ArrowDownCircle, label: "Dépôts" },
      { href: "/dashboard/matches", icon: Trophy, label: "Matchs" },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
      { href: "/dashboard/settings", icon: Settings, label: "Configuration", betikaHidden: true },
      { href: "/dashboard/logs", icon: ScrollText, label: "Audit Log", betikaHidden: true },
    ],
  },
];

interface SidebarNavProps {
  readOnly?: boolean;
}

export function SidebarNav({ readOnly }: SidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const prefix = readOnly ? "/betika" : "/dashboard";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-white/5 bg-brand-blue-950/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
        {!collapsed && (
          <Image src={readOnly ? "/favicon.png" : "/logo.png"} alt="WhatsBet" width={readOnly ? 36 : 140} height={40} className={readOnly ? "h-9 w-9" : "h-9 w-auto"} />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {readOnly && !collapsed && (
        <div className="mx-3 mt-3 rounded-lg border border-brand-yellow-500/20 bg-brand-yellow-500/5 px-3 py-2 text-center text-[11px] font-medium text-brand-yellow-500">
          Lecture seule · Betika
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto p-3 scrollbar-thin">
        {navGroups.map((group) => {
          const items = group.items.filter((i) => !readOnly || !i.betikaHidden);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label }) => {
                  const path = readOnly ? href.replace("/dashboard", "/betika") : href;
                  const active = pathname === path || (path !== prefix && pathname.startsWith(path));
                  return (
                    <Link
                      key={href}
                      href={path}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-brand-yellow-500/10 text-brand-yellow-500 ring-1 ring-brand-yellow-500/20"
                          : "text-muted hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-yellow-500")} />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
