"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PROVINCE_OPTIONS } from "@/lib/province-label";
import type { Parieur } from "@/components/parieurs/parieurs-module";

interface ParieurDetailActionsProps {
  parieur: Parieur;
}

export function ParieurDetailActions({ parieur }: ParieurDetailActionsProps) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    phone: parieur.phone,
    name: parieur.name ?? "",
    province: parieur.province ?? "",
    status: parieur.status,
  });

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/parieurs/${parieur.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          name: form.name || null,
          province: form.province || null,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setModal(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/parieurs/${parieur.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Suppression impossible");
        setDeleteOpen(false);
        return;
      }
      router.push("/dashboard/parieurs");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock() {
    const next = parieur.status === "blocked" ? "active" : "blocked";
    await fetch(`/api/parieurs/${parieur.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/dashboard/conversations?id=${parieur.id}`}>
          <Button variant="secondary" size="sm">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </Button>
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setModal(true)}>
          <Pencil className="h-4 w-4" />
          Modifier
        </Button>
        <Button
          variant={parieur.status === "blocked" ? "secondary" : "danger"}
          size="sm"
          onClick={() => void toggleBlock()}
        >
          {parieur.status === "blocked" ? "Débloquer" : "Bloquer"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4 text-red-400" />
        </Button>
      </div>

      {error && !modal && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" aria-label="Fermer" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#071428]/95 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Modifier le parieur</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Téléphone</label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="font-mono" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Nom</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Province</label>
                <select
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
                >
                  <option value="">— Non renseignée —</option>
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Parieur["status"] }))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
                >
                  <option value="active">Actif</option>
                  <option value="blocked">Bloqué</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setModal(false)} disabled={saving}>Annuler</Button>
                <Button onClick={() => void save()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Supprimer ce parieur ?"
        description="Cette action est irréversible pour les comptes sans historique ni solde."
        confirmLabel="Supprimer"
        loading={saving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
