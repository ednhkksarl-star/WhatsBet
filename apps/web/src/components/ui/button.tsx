import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-yellow-500 text-brand-blue-950 hover:bg-brand-yellow-400 shadow-lg shadow-brand-yellow-500/20 font-semibold",
  secondary:
    "bg-white/5 text-white hover:bg-white/10 border border-white/10",
  ghost: "text-muted hover:text-white hover:bg-white/5",
  danger: "bg-error/15 text-error hover:bg-error/25 border border-error/20",
  outline:
    "border border-brand-yellow-500/40 text-brand-yellow-500 hover:bg-brand-yellow-500/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
