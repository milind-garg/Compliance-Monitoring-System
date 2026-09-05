"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white hover:bg-[#24333b]",
        secondary: "bg-[var(--secondary)] text-white hover:bg-[#245250]",
        accent: "bg-[var(--accent)] text-white hover:bg-[#9e6636]",
        destructive: "bg-[var(--danger)] text-white hover:bg-[#a93226]",
        outline: "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--stone)]/50",
        ghost: "text-[var(--foreground)] hover:bg-[var(--stone)]/50",
        link: "text-[var(--secondary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";
