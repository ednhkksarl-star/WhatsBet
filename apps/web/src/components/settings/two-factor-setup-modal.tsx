"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TwoFactorSetupModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  uri: string;
  secret: string;
  email?: string;
};

export function TwoFactorSetupModal({
  open,
  onClose,
  onConfirmed,
  uri,
  secret,
  email,
}: TwoFactorSetupModalProps) {
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (confirmed || window.confirm("Fermer sans confirmer le 2FA ?"))) {
        onClose();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, confirmed]);

  useEffect(() => {
    if (!open) {
      setCopiedSecret(false);
      setCopiedUri(false);
      setConfirmCode("");
      setConfirmError("");
      setConfirmed(false);
    }
  }, [open]);

  async function copy(text: string, kind: "secret" | "uri") {
    await navigator.clipboard.writeText(text);
    if (kind === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    }
  }

  async function confirmSetup() {
    setConfirmError("");
    const code = confirmCode.replace(/\D/g, "");
    if (code.length !== 6) {
      setConfirmError("Entrez les 6 chiffres affichés dans votre app.");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch("/api/auth/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConfirmError(data.error ?? "Code incorrect");
        return;
      }
      setConfirmed(true);
      onConfirmed();
    } catch {
      setConfirmError("Erreur réseau");
    } finally {
      setConfirming(false);
    }
  }

  if (typeof document === "undefined") return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(uri)}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-[#020617]/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (confirmed || window.confirm("Fermer sans confirmer le 2FA ?")) onClose();
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="twofa-modal-title"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#071428] shadow-2xl shadow-black/60"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow-500/50 to-transparent" />

            <button
              type="button"
              onClick={() => {
                if (confirmed || window.confirm("Fermer sans confirmer le 2FA ?")) onClose();
              }}
              className="absolute right-4 top-4 z-10 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-white/10 bg-[#0a1830] px-6 pb-5 pt-6">
              <div className="flex items-start gap-4 pr-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow-500/15 ring-1 ring-brand-yellow-500/30">
                  <ShieldCheck className="h-6 w-6 text-brand-yellow-500" />
                </div>
                <div>
                  <h2 id="twofa-modal-title" className="text-xl font-bold text-white">
                    {confirmed ? "2FA activée" : "Configurer le 2FA"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {confirmed
                      ? "Votre compte est protégé. Conservez votre app d'authentification."
                      : "Scannez le QR code, puis confirmez avec un code pour finaliser l'activation."}
                  </p>
                  {email && (
                    <p className="mt-2 font-mono text-xs text-brand-yellow-500/90">{email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              {!confirmed && (
                <>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div className="shrink-0 rounded-2xl border border-white/10 bg-white p-3 shadow-lg">
                      <img
                        src={qrUrl}
                        alt="QR code 2FA WhatsBet"
                        width={220}
                        height={220}
                        className="h-[220px] w-[220px]"
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="rounded-2xl border border-brand-blue-700/40 bg-brand-blue-900/30 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Clé secrète (saisie manuelle)
                        </p>
                        <p className="mt-2 break-all font-mono text-sm leading-relaxed text-white">{secret}</p>
                        <button
                          type="button"
                          onClick={() => void copy(secret, "secret")}
                          className={cn(
                            "mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                            copiedSecret
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          )}
                        >
                          {copiedSecret ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedSecret ? "Copié" : "Copier la clé"}
                        </button>
                      </div>

                      <ol className="space-y-2 text-sm text-slate-400">
                        <li className="flex gap-2">
                          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow-500" />
                          Ouvrez Google Authenticator, Authy ou une app TOTP
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-yellow-500/20 text-[10px] font-bold text-brand-yellow-500">
                            2
                          </span>
                          Scannez ce QR code (une seule fois — ne recliquez pas « Activer 2FA »)
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-yellow-500/20 text-[10px] font-bold text-brand-yellow-500">
                            3
                          </span>
                          Entrez le code à 6 chiffres ci-dessous pour valider
                        </li>
                      </ol>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-yellow-500/20 bg-brand-yellow-500/5 px-4 py-3 text-xs leading-relaxed text-brand-yellow-500/90">
                    Ne fermez pas cette fenêtre avant la confirmation. Sinon le code de votre app ne correspondra
                    pas à la base de données.
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="twofa-confirm-code" className="text-sm font-medium text-white/80">
                      Code de vérification
                    </label>
                    <input
                      id="twofa-confirm-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full rounded-xl border border-brand-blue-600 bg-brand-blue-900/50 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-white placeholder-white/30 focus:border-brand-yellow-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow-500/20"
                    />
                    {confirmError && <p className="text-xs text-red-400">{confirmError}</p>}
                  </div>

                  <details className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-300">
                      Lien otpauth (avancé)
                    </summary>
                    <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-slate-500">{uri}</p>
                    <button
                      type="button"
                      onClick={() => void copy(uri, "uri")}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      {copiedUri ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedUri ? "Copié" : "Copier le lien"}
                    </button>
                  </details>
                </>
              )}

              {confirmed && (
                <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-4 text-sm text-success">
                  Le 2FA est actif. À la prochaine connexion, entrez le code affiché dans votre app.
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-[#0a1830] px-6 py-4">
              {confirmed ? (
                <Button className="w-full" onClick={onClose}>
                  Fermer
                </Button>
              ) : (
                <Button className="w-full" onClick={() => void confirmSetup()} disabled={confirming}>
                  {confirming ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vérification…
                    </span>
                  ) : (
                    "Confirmer l'activation"
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
