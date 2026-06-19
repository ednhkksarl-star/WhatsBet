"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

interface TopbarProps {
  userName: string;
  userRole: string;
  readOnly?: boolean;
  pendingCount?: number;
}

export function Topbar({ userName, userRole, readOnly, pendingCount = 0 }: TopbarProps) {
  const notifPath = readOnly ? "/betika" : "/dashboard/notifications";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-background/80 px-6 backdrop-blur-xl">
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher utilisateurs, tickets..." className="h-9 pl-9" />
      </div>

      <div className="flex items-center gap-4 md:ml-auto">
        <Link
          href={notifPath}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted transition hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <Avatar name={userName} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">{userName}</p>
            <p className="text-[11px] text-muted">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
