import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  won: "bg-success/15 text-success border-success/30",
  lost: "bg-error/15 text-error border-error/30",
  cancelled: "bg-white/8 text-slate-300 border-white/15",
  approved: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  rejected: "bg-error/15 text-error border-error/30",
  paid: "bg-success/15 text-success border-success/30",
  active: "bg-success/15 text-success border-success/30",
  blocked: "bg-error/15 text-error border-error/30",
  suspended: "bg-warning/15 text-warning border-warning/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-error/15 text-error border-error/30",
  scheduled: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  live: "bg-error/15 text-error border-error/30 animate-pulse",
  finished: "bg-white/8 text-slate-300 border-white/15",
};

const LABELS: Record<string, string> = {
  pending: "En attente",
  won: "Gagné",
  lost: "Perdu",
  cancelled: "Annulé",
  approved: "Approuvé",
  rejected: "Rejeté",
  paid: "Payé",
  active: "Actif",
  blocked: "Bloqué",
  suspended: "Suspendu",
  completed: "Complété",
  failed: "Échoué",
  scheduled: "Programmé",
  live: "En direct",
  finished: "Terminé",
  deposit: "Dépôt",
};

export function Badge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        styles[key] ?? "bg-white/8 text-slate-300 border-white/15",
        className
      )}
    >
      {LABELS[key] ?? status.replace(/_/g, " ")}
    </span>
  );
}
