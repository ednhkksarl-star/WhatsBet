"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DetailSidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg" | "xl";
  children: React.ReactNode;
};

const WIDTH = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

export function DetailSidePanel({
  open,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  footer,
  width = "lg",
  children,
}: DetailSidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Fermer le panneau"
            className="fixed inset-0 z-[400] bg-[#020617]/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="side-panel-title"
            className={cn(
              "fixed inset-y-0 right-0 z-[401] isolate flex w-full flex-col border-l border-brand-yellow-500/30 bg-[#071428] shadow-[-32px_0_100px_rgba(0,0,0,0.65)]",
              WIDTH[width]
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-brand-yellow-500/20 via-brand-yellow-500/70 to-brand-yellow-500/20" />

            <header className="relative shrink-0 border-b border-white/10 bg-[#0a1830] px-6 pb-5 pt-6">
              <div className="flex items-start gap-4">
                {icon && (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-yellow-500/15 ring-1 ring-brand-yellow-500/35">
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="side-panel-title" className="text-lg font-bold leading-tight text-white">
                      {title}
                    </h2>
                    {badge}
                  </div>
                  {subtitle && <p className="mt-1.5 font-mono text-sm text-slate-300">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto bg-[#071428] px-6 py-5 scrollbar-thin">
              {children}
            </div>

            {footer && (
              <footer className="relative shrink-0 border-t border-white/10 bg-[#0a1830] px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SidePanelSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-6 last:mb-0", className)}>
      {title && (
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-yellow-500">
          {title}
        </h3>
      )}
      <div className="rounded-2xl border border-white/10 bg-[#0d2040]/80 p-4">
        {children}
      </div>
    </section>
  );
}

export function SidePanelRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0 [&+&]:border-t [&+&]:border-white/[0.08]">
      <dt className="shrink-0 text-xs font-medium text-slate-400">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm text-white",
          mono && "font-mono text-[13px] text-slate-200",
          highlight && "font-semibold text-brand-yellow-500"
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function SidePanelStats({
  items,
}: {
  items: { label: string; value: string; accent?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-[#0a1830] p-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
          <p
            className={cn(
              "mt-1.5 font-mono text-base font-bold leading-snug",
              item.accent ? "text-brand-yellow-500" : "text-white"
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
