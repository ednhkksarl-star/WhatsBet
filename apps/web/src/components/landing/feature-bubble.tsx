import { cn } from "@/lib/utils";

export type FeatureBubbleProps = {
  value: string;
  label: string;
  className?: string;
  bgClass?: string;
  borderClass?: string;
  valueClass?: string;
  glowClass?: string;
};

export function FeatureBubble({
  value,
  label,
  className,
  bgClass = "bg-brand-blue-900/90",
  borderClass = "border-brand-blue-600/50",
  valueClass = "text-brand-yellow-500",
  glowClass = "glow-blue",
}: FeatureBubbleProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-lg backdrop-blur-sm",
        bgClass,
        borderClass,
        glowClass,
        className
      )}
    >
      <p className={cn("text-lg font-black leading-none", valueClass)}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/80">{label}</p>
    </div>
  );
}
