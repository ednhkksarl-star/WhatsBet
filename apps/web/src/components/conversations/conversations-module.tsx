"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  CheckSquare,
  ChevronDown,
  Loader2,
  Megaphone,
  MessageSquare,
  Phone,
  Search,
  Send,
  Square,
  Trash2,
  User,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatCdf } from "@/lib/utils";

export type ConversationSummary = {
  id: string;
  phone: string;
  displayPhone: string;
  whatsappJid?: string | null;
  profilePictureBase64?: string | null;
  name: string | null;
  balance: string;
  status: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  userMessageCount: number;
  botMessageCount: number;
  unread: boolean;
};

export type ConversationMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  createdAt: string;
};

const QUICK_REPLIES = [
  "Bonjour ! Comment puis-je vous aider ?",
  "Consultez les matchs du jour en tapant « matchs ».",
  "Votre solde a été mis à jour.",
  "Votre retrait est en cours de traitement.",
];

type Tab = "conversations" | "broadcast";

type PendingConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "danger" | "primary";
  action: () => Promise<void>;
};

interface ConversationsModuleProps {
  conversations: ConversationSummary[];
  messages: ConversationMessage[];
  selectedId?: string;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConvAvatar({
  conv,
  avatars,
  size = "md",
  className,
}: {
  conv: ConversationSummary;
  avatars: Record<string, string | null>;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = avatars[conv.id] ?? conv.profilePictureBase64 ?? undefined;
  return <Avatar name={conv.name ?? conv.displayPhone} src={src} size={size} className={className} />;
}

export function ConversationsModule({ conversations, messages, selectedId }: ConversationsModuleProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("conversations");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [broadcastDraft, setBroadcastDraft] = useState("");
  const [quickReply, setQuickReply] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localMessages, setLocalMessages] = useState(messages);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [sending, setSending] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [liveConversations, setLiveConversations] = useState(conversations);
  const fetchedAvatars = useRef(new Set<string>());
  const sinceRef = useRef(new Date(Date.now() - 10_000).toISOString());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = liveConversations.find((c) => c.id === selectedId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return liveConversations;
    return liveConversations.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        c.displayPhone.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false) ||
        (c.lastMessage?.toLowerCase().includes(q) ?? false)
    );
  }, [liveConversations, search]);

  useEffect(() => {
    setLiveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    setLocalMessages(messages);
    sinceRef.current = new Date(Date.now() - 10_000).toISOString();
  }, [messages, selectedId]);

  useEffect(() => {
    if (tab !== "conversations") return;

    const poll = async () => {
      try {
        const params = new URLSearchParams({ since: sinceRef.current });
        if (selectedId) params.set("selectedId", selectedId);
        const res = await fetch(`/api/conversations/feed?${params}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        sinceRef.current = data.serverTime ?? new Date().toISOString();
        if (Array.isArray(data.conversations)) {
          setLiveConversations(data.conversations);
        }
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setLocalMessages((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));
            for (const m of data.messages as ConversationMessage[]) {
              byId.set(m.id, m);
            }
            return Array.from(byId.values());
          });
        }
      } catch {
        /* ignore poll errors */
      }
    };

    poll();
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [selectedId, tab]);

  useEffect(() => {
    const initial: Record<string, string | null> = {};
    for (const c of liveConversations) {
      if (c.profilePictureBase64) initial[c.id] = c.profilePictureBase64;
    }
    setAvatars(initial);
  }, [liveConversations]);

  useEffect(() => {
    if (!selectedId || avatars[selectedId] || fetchedAvatars.current.has(selectedId)) return;
    fetchedAvatars.current.add(selectedId);
    fetch(`/api/conversations/profile-picture?userId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.base64) {
          setAvatars((prev) => ({ ...prev, [selectedId]: data.base64 }));
        }
      })
      .catch(() => {});
  }, [selectedId, avatars]);

  useEffect(() => {
    for (const conv of filtered.slice(0, 8)) {
      if (avatars[conv.id] || conv.profilePictureBase64 || fetchedAvatars.current.has(conv.id)) continue;
      fetchedAvatars.current.add(conv.id);
      fetch(`/api/conversations/profile-picture?userId=${conv.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.base64) {
            setAvatars((prev) => ({ ...prev, [conv.id]: data.base64 }));
          }
        })
        .catch(() => {});
    }
  }, [filtered, avatars]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  function selectConversation(id: string) {
    router.push(`/dashboard/conversations?id=${id}`);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  function applyQuickReply() {
    if (quickReply) setDraft(quickReply);
  }

  const sortedMessages = useMemo(
    () =>
      [...localMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [localMessages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const sendMessage = useCallback(async () => {
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedId, text: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec envoi");
      if (data.message) {
        setLocalMessages((prev) => [...prev, data.message]);
      }
      setDraft("");
      router.refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Échec envoi");
    } finally {
      setSending(false);
    }
  }, [selectedId, draft, sending, router]);

  const sendBroadcast = useCallback(async () => {
    if (!broadcastDraft.trim() || broadcasting) return;
    setPendingConfirm({
      title: "Diffuser le message",
      description: `Ce message sera envoyé à ${liveConversations.length} joueur(s) ayant déjà contacté le bot via WhatsApp.`,
      confirmLabel: "Envoyer à tous",
      variant: "primary",
      action: async () => {
        setBroadcasting(true);
        setFeedback(null);
        try {
          const res = await fetch("/api/conversations/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: broadcastDraft.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Échec diffusion");
          setFeedback(`Message envoyé à ${data.sent}/${data.total} joueur(s).`);
          setBroadcastDraft("");
          router.refresh();
        } catch (err) {
          setFeedback(err instanceof Error ? err.message : "Échec diffusion");
        } finally {
          setBroadcasting(false);
        }
      },
    });
  }, [broadcastDraft, broadcasting, liveConversations.length, router]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0 || deleting) return;
    const count = selectedIds.size;
    setPendingConfirm({
      title: count === 1 ? "Supprimer la discussion" : `Supprimer ${count} discussions`,
      description:
        count === 1
          ? "Voulez-vous effacer l'historique de messages de cette conversation ?"
          : `Voulez-vous effacer l'historique de ${count} conversations sélectionnées ?`,
      confirmLabel: "Supprimer",
      variant: "danger",
      action: async () => {
        setDeleting(true);
        setFeedback(null);
        try {
          const res = await fetch("/api/conversations", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: Array.from(selectedIds) }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Échec suppression");
          setSelectedIds(new Set());
          if (selectedId && selectedIds.has(selectedId)) {
            router.push("/dashboard/conversations");
          } else {
            router.refresh();
          }
        } catch (err) {
          setFeedback(err instanceof Error ? err.message : "Échec suppression");
        } finally {
          setDeleting(false);
        }
      },
    });
  }, [selectedIds, deleting, selectedId, router]);

  async function handleConfirm() {
    if (!pendingConfirm) return;
    setConfirmLoading(true);
    try {
      await pendingConfirm.action();
      setPendingConfirm(null);
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#071428]/80">
      <div className="border-b border-white/8 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Conversations</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Historique des échanges WhatsApp ·{" "}
              <span className="text-brand-yellow-500">WhatsBet Bot</span>
            </p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setTab("conversations")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                tab === "conversations"
                  ? "bg-brand-blue-800 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Conversations
            </button>
            <button
              type="button"
              onClick={() => setTab("broadcast")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                tab === "broadcast"
                  ? "bg-brand-blue-800 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Megaphone className="h-4 w-4" />
              Diffusion
            </button>
          </div>
        </div>
        {feedback && (
          <p className="mt-2 text-sm text-brand-yellow-500">{feedback}</p>
        )}
      </div>

      {tab === "broadcast" ? (
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-2xl flex-1">
            <div className="rounded-2xl border border-white/8 bg-[#050f1f]/60 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-800/50">
                  <Megaphone className="h-6 w-6 text-brand-yellow-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Message à tous les joueurs</h2>
                  <p className="text-sm text-slate-400">
                    {liveConversations.length} joueur(s) ayant déjà écrit au bot recevront ce message.
                  </p>
                </div>
              </div>
              <textarea
                value={broadcastDraft}
                onChange={(e) => setBroadcastDraft(e.target.value)}
                placeholder="Rédigez votre annonce ou message groupé..."
                rows={8}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-yellow-500/40 focus:ring-2 focus:ring-brand-yellow-500/10"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={sendBroadcast}
                  disabled={!broadcastDraft.trim() || broadcasting}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  {broadcasting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer à tous
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[min(100%,340px)] shrink-0 flex-col border-r border-white/8 bg-[#050f1f]/60">
            <div className="border-b border-white/8 p-3 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un joueur..."
                  className="h-9 border-white/10 bg-white/5 pl-9 text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="h-3.5 w-3.5" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  Tout sélectionner
                </button>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Supprimer ({selectedIds.size})
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">Aucune conversation</p>
              ) : (
                filtered.map((conv) => {
                  const active = conv.id === selectedId;
                  const checked = selectedIds.has(conv.id);
                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        "flex w-full items-start gap-2 border-b border-white/5 px-2 py-2 transition",
                        active ? "bg-brand-blue-800/40" : "hover:bg-white/[0.03]"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelect(conv.id)}
                        className="mt-3 shrink-0 p-1 text-slate-500 hover:text-white"
                        aria-label={checked ? "Désélectionner" : "Sélectionner"}
                      >
                        {checked ? (
                          <CheckSquare className="h-4 w-4 text-brand-yellow-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => selectConversation(conv.id)}
                        className="flex min-w-0 flex-1 items-start gap-3 py-1.5 text-left"
                      >
                        <ConvAvatar conv={conv} avatars={avatars} size="md" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {conv.name ?? conv.displayPhone}
                            </p>
                            <span className="shrink-0 text-[10px] text-slate-500">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-sky-400/80">{conv.displayPhone}</p>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-slate-400">
                              {conv.lastMessage ?? "Aucun message"}
                            </p>
                            {conv.unread && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                1
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-[#030b1a]/50">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                  <MessageSquare className="h-8 w-8 text-slate-500" />
                </div>
                <h2 className="text-lg font-semibold text-white">Sélectionnez une conversation</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Choisissez un joueur pour voir l&apos;historique et répondre via WhatsApp.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-white/8 px-5 py-3.5">
                  <ConvAvatar conv={selected} avatars={avatars} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {selected.name ?? selected.displayPhone}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-sky-400">
                      <Phone className="h-3 w-3" />
                      {selected.displayPhone}
                    </p>
                  </div>
                  <Badge status={selected.status} />
                </div>

                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 scrollbar-thin">
                  {sortedMessages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                      Aucun message échangé
                    </div>
                  ) : (
                    sortedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex", msg.fromMe ? "justify-start" : "justify-end")}
                      >
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            msg.fromMe
                              ? "rounded-tl-sm bg-[#1a2f4a] text-white"
                              : "rounded-tr-sm bg-[#0d4f5c] text-slate-100 ring-1 ring-white/10"
                          )}
                        >
                          {msg.fromMe && (
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-brand-yellow-500">
                              <Bot className="h-3 w-3" />
                              WhatsBet Bot
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          <p
                            className={cn(
                              "mt-1.5 text-[10px]",
                              msg.fromMe ? "text-slate-400" : "text-slate-300/70"
                            )}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/8 bg-[#050f1f]/80 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <select
                        value={quickReply}
                        onChange={(e) => setQuickReply(e.target.value)}
                        className="h-9 w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-3 pr-8 text-xs text-slate-300 outline-none focus:border-brand-yellow-500/40"
                      >
                        <option value="">Réponse rapide...</option>
                        {QUICK_REPLIES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    </div>
                    <button
                      type="button"
                      onClick={applyQuickReply}
                      disabled={!quickReply}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
                    >
                      Insérer
                    </button>
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Écrire un message à envoyer sur WhatsApp..."
                      rows={2}
                      className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-yellow-500/40 focus:ring-2 focus:ring-brand-yellow-500/10"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!draft.trim() || sending}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-500 disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="hidden w-72 shrink-0 flex-col border-l border-white/8 bg-[#050f1f]/60 xl:flex">
            {selected ? (
              <>
                <div className="border-b border-white/8 p-5 text-center">
                  <ConvAvatar conv={selected} avatars={avatars} size="lg" className="mx-auto" />
                  <p className="mt-3 font-semibold text-white">{selected.name ?? "Joueur"}</p>
                  <p className="text-xs text-slate-500">Profil WhatsApp</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                  <dl className="space-y-3 text-sm">
                    {[
                      ["Numéro complet", selected.displayPhone],
                      ["Identifiant", selected.id.slice(0, 8) + "…"],
                      ["Plateforme", "WhatsApp"],
                      ["Nom déclaré", selected.name ?? "—"],
                      ["Solde", formatCdf(selected.balance)],
                      ["Première interaction", formatDateTime(selected.createdAt)],
                      ["Dernière activité", formatDateTime(selected.lastMessageAt)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </dt>
                        <dd className="mt-0.5 text-slate-200">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Activité
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/5 p-3 text-center">
                        <p className="text-lg font-bold text-white">{selected.userMessageCount}</p>
                        <p className="text-[10px] text-slate-500">Messages joueur</p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3 text-center">
                        <p className="text-lg font-bold text-white">{selected.botMessageCount}</p>
                        <p className="text-[10px] text-slate-500">Messages bot</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href="/dashboard/parieurs"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-yellow-500 hover:underline"
                    >
                      <User className="h-3.5 w-3.5" />
                      Voir la fiche parieur
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-500">
                Sélectionnez une conversation pour voir le profil
              </div>
            )}
          </aside>
        </div>
      )}
      <ConfirmDialog
        open={!!pendingConfirm}
        title={pendingConfirm?.title ?? ""}
        description={pendingConfirm?.description ?? ""}
        confirmLabel={pendingConfirm?.confirmLabel}
        variant={pendingConfirm?.variant}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
