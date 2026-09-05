import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-1 text-sm shadow-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
