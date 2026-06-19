"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { STAFF_PERMISSIONS, permissionsByGroup } from "@/lib/staff-permissions";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
} from "lucide-react";

type Tab = "team" | "roles";

interface StaffRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  adminRole: string;
  isSystem: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  staffRoleId: string | null;
  avatarBase64: string | null;
  status: "active" | "disabled";
  twoFactorEnabled: boolean;
  createdAt: string;
  staffRole?: StaffRole | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  AGENT: "Agent",
  SUPPORT: "Support",
  BETIKA: "Betika",
};

function avatarSrc(base64: string | null | undefined) {
  if (!base64) return undefined;
  if (base64.startsWith("data:")) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function StaffModule() {
  const [tab, setTab] = useState<Tab>("team");
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [memberModal, setMemberModal] = useState<"create" | "edit" | null>(null);
  const [roleModal, setRoleModal] = useState<"create" | "edit" | null>(null);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<StaffRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "member" | "role"; id: string; name: string } | null>(null);

  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    password: "",
    staffRoleId: "",
    status: "active" as "active" | "disabled",
    avatarBase64: null as string | null,
  });

  const [roleForm, setRoleForm] = useState({
    name: "",
    slug: "",
    description: "",
    adminRole: "SUPPORT" as StaffRole["adminRole"],
    permissions: [] as string[],
  });

  const permissionGroups = useMemo(() => permissionsByGroup(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([fetch("/api/staff/members"), fetch("/api/staff/roles")]);
      const mData = await mRes.json();
      const rData = await rRes.json();
      if (mRes.ok) setMembers(mData.members ?? []);
      if (rRes.ok) setRoles(rData.roles ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreateMember() {
    setEditMember(null);
    setMemberForm({
      name: "",
      email: "",
      password: "",
      staffRoleId: roles[0]?.id ?? "",
      status: "active",
      avatarBase64: null,
    });
    setMemberModal("create");
  }

  function openEditMember(m: StaffMember) {
    setEditMember(m);
    setMemberForm({
      name: m.name,
      email: m.email,
      password: "",
      staffRoleId: m.staffRoleId ?? roles[0]?.id ?? "",
      status: m.status,
      avatarBase64: m.avatarBase64,
    });
    setMemberModal("edit");
  }

  function openCreateRole() {
    setEditRole(null);
    setRoleForm({
      name: "",
      slug: "",
      description: "",
      adminRole: "SUPPORT",
      permissions: [],
    });
    setRoleModal("create");
  }

  function openEditRole(r: StaffRole) {
    setEditRole(r);
    setRoleForm({
      name: r.name,
      slug: r.slug,
      description: r.description ?? "",
      adminRole: r.adminRole,
      permissions: [...r.permissions],
    });
    setRoleModal("edit");
  }

  async function handleAvatarFile(file: File | null) {
    if (!file) return;
    if (file.size > 400_000) {
      alert("Image trop volumineuse (max 400 Ko)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setMemberForm((f) => ({ ...f, avatarBase64: result }));
    };
    reader.readAsDataURL(file);
  }

  async function saveMember() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: memberForm.name,
        email: memberForm.email,
        staffRoleId: memberForm.staffRoleId,
        status: memberForm.status,
        avatarBase64: memberForm.avatarBase64,
      };
      if (memberForm.password) payload.password = memberForm.password;

      const url = memberModal === "edit" && editMember ? `/api/staff/members/${editMember.id}` : "/api/staff/members";
      const method = memberModal === "edit" ? "PATCH" : "POST";
      if (memberModal === "create") payload.password = memberForm.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erreur");
        return;
      }
      setMemberModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveRole() {
    setSaving(true);
    try {
      const payload = { ...roleForm };
      const url = roleModal === "edit" && editRole ? `/api/staff/roles/${editRole.id}` : "/api/staff/roles";
      const method = roleModal === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erreur");
        return;
      }
      setRoleModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const url =
        deleteTarget.type === "member"
          ? `/api/staff/members/${deleteTarget.id}`
          : `/api/staff/roles/${deleteTarget.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erreur");
        return;
      }
      setDeleteTarget(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(key: string) {
    setRoleForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  }

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Agents, administrateurs et gestion des rôles"
        badge={`${members.filter((m) => m.status === "active").length} actifs`}
        action={
          tab === "team" ? (
            <Button onClick={openCreateMember}>
              <Plus className="h-4 w-4" />
              Nouveau membre
            </Button>
          ) : (
            <Button onClick={openCreateRole}>
              <Plus className="h-4 w-4" />
              Nouveau rôle
            </Button>
          )
        }
      />

      <div className="mb-6 flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {(
          [
            ["team", "Équipe", Users],
            ["roles", "Rôles & permissions", Shield],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
              tab === key ? "bg-brand-yellow-500/10 text-brand-yellow-500 ring-1 ring-brand-yellow-500/20" : "text-muted hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-yellow-500" />
        </div>
      ) : tab === "team" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Membre</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">2FA</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      Aucun membre. Créez le premier utilisateur staff.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} src={avatarSrc(m.avatarBase64)} size="sm" />
                          <span className="font-medium text-white">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted">{m.email}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-brand-yellow-500">
                          {m.staffRole?.name ?? ROLE_LABELS[m.role] ?? m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={m.status === "active" ? "active" : "blocked"} />
                      </td>
                      <td className="px-6 py-4 text-muted">{m.twoFactorEnabled ? "Oui" : "Non"}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditMember(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: "member", id: m.id, name: m.name })}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-brand-yellow-500" />
                    <h3 className="font-semibold text-white">{r.name}</h3>
                    {r.isSystem && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-muted">Système</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-mono text-muted">{r.slug}</p>
                  {r.description && <p className="mt-2 text-sm text-muted">{r.description}</p>}
                  <p className="mt-2 text-xs text-muted">
                    Niveau JWT : <span className="text-white">{ROLE_LABELS[r.adminRole] ?? r.adminRole}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditRole(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!r.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "role", id: r.id, name: r.name })}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {r.permissions.slice(0, 8).map((p) => (
                  <span key={p} className="rounded-md bg-brand-blue-900/60 px-2 py-0.5 text-[10px] text-muted">
                    {STAFF_PERMISSIONS.find((x) => x.key === p)?.label ?? p}
                  </span>
                ))}
                {r.permissions.length > 8 && (
                  <span className="text-[10px] text-muted">+{r.permissions.length - 8}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Member modal */}
      {(memberModal === "create" || memberModal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-elevated w-full max-w-lg rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {memberModal === "create" ? "Nouveau membre" : "Modifier le membre"}
              </h2>
              <button type="button" onClick={() => setMemberModal(null)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <Avatar name={memberForm.name || "?"} src={avatarSrc(memberForm.avatarBase64)} size="lg" />
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-2 text-sm text-muted hover:border-brand-yellow-500/30 hover:text-white">
                <Upload className="h-4 w-4" />
                Photo (base64)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void handleAvatarFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {memberForm.avatarBase64 && (
                <button
                  type="button"
                  className="text-xs text-red-400"
                  onClick={() => setMemberForm((f) => ({ ...f, avatarBase64: null }))}
                >
                  Retirer
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-muted">Nom complet</label>
                <Input value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Email</label>
                <Input type="email" value={memberForm.email} onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">
                  {memberModal === "create" ? "Mot de passe" : "Nouveau mot de passe (optionnel)"}
                </label>
                <Input
                  type="password"
                  value={memberForm.password}
                  onChange={(e) => setMemberForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={memberModal === "edit" ? "Laisser vide pour conserver" : ""}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Rôle</label>
                <select
                  value={memberForm.staffRoleId}
                  onChange={(e) => setMemberForm((f) => ({ ...f, staffRoleId: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-brand-blue-950/80 px-4 py-2.5 text-sm text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Statut</label>
                <select
                  value={memberForm.status}
                  onChange={(e) => setMemberForm((f) => ({ ...f, status: e.target.value as "active" | "disabled" }))}
                  className="w-full rounded-xl border border-white/10 bg-brand-blue-950/80 px-4 py-2.5 text-sm text-white"
                >
                  <option value="active">Actif</option>
                  <option value="disabled">Désactivé</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setMemberModal(null)}>
                Annuler
              </Button>
              <Button
                disabled={saving || !memberForm.name || !memberForm.email || (memberModal === "create" && memberForm.password.length < 8)}
                onClick={() => void saveMember()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role modal */}
      {(roleModal === "create" || roleModal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-elevated max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {roleModal === "create" ? "Nouveau rôle" : "Modifier le rôle"}
              </h2>
              <button type="button" onClick={() => setRoleModal(null)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-muted">Nom</label>
                  <Input
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((f) => ({
                        ...f,
                        name: e.target.value,
                        slug: roleModal === "create" ? slugify(e.target.value) : f.slug,
                      }))
                    }
                    disabled={editRole?.isSystem}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-muted">Slug</label>
                  <Input
                    value={roleForm.slug}
                    onChange={(e) => setRoleForm((f) => ({ ...f, slug: e.target.value }))}
                    disabled={editRole?.isSystem}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Description</label>
                <Input
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Niveau d&apos;accès (JWT)</label>
                <select
                  value={roleForm.adminRole}
                  onChange={(e) => setRoleForm((f) => ({ ...f, adminRole: e.target.value }))}
                  disabled={editRole?.isSystem}
                  className="w-full rounded-xl border border-white/10 bg-brand-blue-950/80 px-4 py-2.5 text-sm text-white"
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-white">Permissions</p>
                <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  {[...permissionGroups.entries()].map(([group, perms]) => (
                    <div key={group}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {perms.map((p) => (
                          <label key={p.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={roleForm.permissions.includes(p.key)}
                              onChange={() => togglePermission(p.key)}
                              className="rounded border-white/20"
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRoleModal(null)}>
                Annuler
              </Button>
              <Button disabled={saving || !roleForm.name || !roleForm.slug} onClick={() => void saveRole()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === "member" ? "Supprimer ce membre ?" : "Supprimer ce rôle ?"}
        description={`${deleteTarget?.name} sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={saving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
