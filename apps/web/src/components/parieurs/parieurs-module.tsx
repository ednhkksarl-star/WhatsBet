"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PROVINCE_OPTIONS } from "@/lib/province-label";
import { formatCdf } from "@/lib/utils";

export interface Parieur {
  id: string;
  phone: string;
  name: string | null;
  profilePictureBase64: string | null;
  balance: string;
  status: "active" | "blocked" | "suspended";
  province: string | null;
  createdAt: string;
  updatedAt: string;
}

function avatarSrc(base64: string | null | undefined) {
  if (!base64) return undefined;
  if (base64.startsWith("data:")) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

const emptyForm = {
  phone: "",
  name: "",
  province: "",
  status: "active" as Parieur["status"],
};

export function ParieursModule() {
  const router = useRouter();
  const [rows, setRows] = useState<Parieur[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Parieur | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Parieur | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parieurs");
      const data = await res.json();
      if (res.ok) setRows(data.parieurs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.phone.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false)
    );
  }, [rows, search]);

  const activeCount = rows.filter((u) => u.status === "active").length;

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setEditTarget(null);
    setModal("create");
  }

  function openEdit(u: Parieur) {
    setForm({
      phone: u.phone,
      name: u.name ?? "",
      province: u.province ?? "",
      status: u.status,
    });
    setError("");
    setEditTarget(u);
    setModal("edit");
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        phone: form.phone,
        name: form.name || null,
        province: form.province || null,
        status: form.status,
      };

      const url = modal === "edit" && editTarget ? `/api/parieurs/${editTarget.id}` : "/api/parieurs";
      const method = modal === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      setModal(null);
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(u: Parieur) {
    const next = u.status === "blocked" ? "active" : "blocked";
    await fetch(`/api/parieurs/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await load();
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/parieurs/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Suppression impossible");
        return;
      }
      setDeleteTarget(null);
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Parieurs"
        description={`${rows.length} joueurs WhatsApp enregistrés`}
        badge={`${activeCount} actifs`}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouveau parieur
          </Button>
        }
      />

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou téléphone…"
          className="h-10 pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={search ? "Aucun résultat" : "Aucun parieur"}
          description={
            search
              ? "Essayez un autre terme de recherche."
              : "Les joueurs seront créés automatiquement à leur premier message WhatsApp, ou ajoutez-en manuellement."
          }
          action={!search ? <Button onClick={openCreate}>Ajouter un parieur</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Joueur</th>
                  <th className="px-6 py-4">Téléphone</th>
                  <th className="px-6 py-4">Solde</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Inscrit</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/parieurs/${u.id}`} className="flex items-center gap-3 hover:text-brand-yellow-500">
                        <Avatar
                          name={u.name ?? u.phone}
                          src={avatarSrc(u.profilePictureBase64)}
                          size="sm"
                        />
                        <span className="font-medium text-white">{u.name ?? "—"}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted">{u.phone}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-brand-yellow-500">{formatCdf(u.balance)}</td>
                    <td className="px-6 py-4"><Badge status={u.status} /></td>
                    <td className="px-6 py-4 text-muted">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/parieurs/${u.id}`}>
                          <Button variant="ghost" size="sm" title="Voir détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" title="Modifier" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={u.status === "blocked" ? "secondary" : "danger"}
                          size="sm"
                          onClick={() => void toggleBlock(u)}
                        >
                          {u.status === "blocked" ? "Débloquer" : "Bloquer"}
                        </Button>
                        <Button variant="ghost" size="sm" title="Supprimer" onClick={() => setDeleteTarget(u)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-[#020617]/75 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#071428]/95 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-white">
              {modal === "create" ? "Nouveau parieur" : "Modifier le parieur"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {modal === "create"
                ? "Créez un joueur manuellement (format +243…)."
                : "Mettez à jour les informations du joueur."}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Téléphone *</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+243812345678"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Nom</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nom affiché WhatsApp"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Province</label>
                <select
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-yellow-500/50"
                >
                  <option value="">— Auto (depuis téléphone) —</option>
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Parieur["status"] }))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-brand-yellow-500/50"
                >
                  <option value="active">Actif</option>
                  <option value="blocked">Bloqué</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
                  Annuler
                </Button>
                <Button onClick={() => void save()} disabled={saving || !form.phone.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : modal === "create" ? "Créer" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce parieur ?"
        description={
          deleteTarget
            ? `${deleteTarget.name ?? deleteTarget.phone} sera définitivement supprimé. Seuls les comptes sans solde ni historique peuvent être effacés.`
            : ""
        }
        confirmLabel="Supprimer"
        loading={saving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
