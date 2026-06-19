"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UserStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function toggle() {
    const next = status === "blocked" ? "active" : "blocked";
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <Button variant={status === "blocked" ? "secondary" : "danger"} size="sm" onClick={toggle}>
      {status === "blocked" ? "Débloquer" : "Bloquer"}
    </Button>
  );
}
