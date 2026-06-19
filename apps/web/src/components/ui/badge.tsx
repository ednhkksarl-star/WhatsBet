import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/25",
  won: "bg-success/10 text-success border-success/25",
  lost: "bg-error/10 text-error border-error/25",
  cancelled: "bg-white/5 text-muted border-white/10",
  approved: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  rejected: "bg-error/10 text-error border-error/25",
  paid: "bg-success/10 text-success border-success/25",
  active: "bg-success/10 text-success border-success/25",
  blocked: "bg-error/10 text-error border-error/25",
  suspended: "bg-warning/10 text-warning border-warning/25",
  completed: "bg-success/10 text-success border-success/25",
  failed: "bg-error/10 text-error border-error/25",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  live: "bg-error/10 text-error border-error/25 animate-pulse",
  finished: "bg-white/5 text-muted border-white/10",
};

export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize tracking-wide",
        styles[status] ?? "bg-white/5 text-muted border-white/10",
        className
      )}
    >
      {status}
    </span>
  );
}
