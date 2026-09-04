"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { authApi, violationApi } from "@/lib/services";
import type { Violation } from "@/types";

const statusVariant: Record<string, "danger" | "warning" | "success" | "outline"> = {
  open:         "danger",
  acknowledged: "warning",
  resolved:     "success",
  closed:       "outline",
};
const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  critical: "danger",
  high:     "warning",
  medium:   "outline",
  low:      "outline",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ViolationsPage() {
  const [search, setSearch] = useState("");

  const [{ data: mines = [] }, { data: violations = [], isLoading }] = useQueries({
    queries: [
      { queryKey: ["mines"], queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]) },
      { queryKey: ["violations"], queryFn: () => violationApi.get("/v1/violations/").then((r) => r.data.items as Violation[]) },
    ],
  });

  const mineMap = Object.fromEntries(mines.map((m) => [m.id, m.name]));

  const filtered = violations.filter((v) => {
    const mineName = mineMap[v.mine_id] ?? v.mine_id;
    return (
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      mineName.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <PageHeader
        title="Violations"
        description="Track and resolve compliance violations"
      />
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                className="pl-9"
                placeholder="Search violations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  {["Description", "Mine", "Category", "Severity", "Status", "Due Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No violations found.</td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-[var(--foreground)]">{v.description}</p>
                      {v.regulation_ref && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{v.regulation_ref}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{mineMap[v.mine_id] ?? "Unknown Mine"}</td>
                    <td className="px-4 py-3 capitalize">{v.category}</td>
                    <td className="px-4 py-3">
                      <Badge variant={severityVariant[v.severity] ?? "outline"}>
                        {v.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[v.status] ?? "outline"}>
                        {v.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(v.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
