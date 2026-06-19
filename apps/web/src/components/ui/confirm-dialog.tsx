"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Megaphone, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ConfirmDialogVariant = "danger" | "primary";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<
  ConfirmDialogVariant,
  { icon: typeof Trash2; iconBg: string; iconColor: string; confirmVariant: "danger" | "primary" }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-500/15 ring-red-500/25",
    iconColor: "text-red-400",
    confirmVariant: "danger",
  },
  primary: {
    icon: Megaphone,
    iconBg: "bg-brand-yellow-500/15 ring-brand-yellow-500/25",
    iconColor: "text-brand-yellow-500",
    confirmVariant: "primary",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-[#020617]/75 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10",
          "bg-[#071428]/95 shadow-2xl shadow-black/50"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow-500/40 to-transparent" />

        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-7">
          <div className="flex gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
                styles.iconBg
              )}
            >
              <Icon className={cn("h-5 w-5", styles.iconColor)} />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
            </div>
          </div>

          {variant === "danger" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-300/90">
                Cette action est irréversible. Les messages seront définitivement effacés.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              ref={cancelRef}
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={loading}
              className="sm:min-w-[100px]"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={styles.confirmVariant}
              size="md"
              onClick={onConfirm}
              disabled={loading}
              className="sm:min-w-[120px]"
            >
              {loading ? "En cours…" : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
