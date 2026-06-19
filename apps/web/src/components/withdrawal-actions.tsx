"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WithdrawalActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function update(action: "approved" | "rejected" | "paid") {
    await fetch(`/api/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => update("approved")}>Approuver</Button>
        <Button variant="danger" size="sm" onClick={() => update("rejected")}>Rejeter</Button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <Button variant="primary" size="sm" onClick={() => update("paid")}>
        Marquer payé
      </Button>
    );
  }

  return null;
}
