import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius)] bg-[var(--stone)]/80 dark:bg-[var(--stone)]/20", className)}
      {...props}
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[var(--border)] animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={`h-4 ${i === 0 ? "w-36" : i === 1 ? "w-28" : i === 2 ? "w-20" : "w-16"}`} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  );
}
