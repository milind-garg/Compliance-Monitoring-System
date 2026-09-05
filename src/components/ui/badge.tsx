import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-[var(--primary)] text-white",
  secondary: "bg-[var(--secondary)] text-white",
  accent: "bg-[var(--accent)] text-white",
  success: "bg-[#2f6664]/15 text-[#1e4846] border border-[#2f6664]/30",
  danger: "bg-red-50 text-red-800 border border-red-200",
  warning: "bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30",
  outline: "border border-[var(--border)] bg-white text-[var(--foreground)]",
  stone: "bg-[var(--stone)] text-[var(--foreground)] border border-[var(--border)]",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
