"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncMatchesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSync() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cron/sync-odds", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Échec de la synchronisation");
        return;
      }

      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" type="button" onClick={handleSync} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync maintenant"}
      </Button>
      {error && <p className="max-w-xs text-right text-xs text-red-400">{error}</p>}
    </div>
  );
}
