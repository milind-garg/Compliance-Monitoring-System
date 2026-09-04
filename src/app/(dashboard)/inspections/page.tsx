"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { authApi, inspectionApi } from "@/lib/services";
import type { Inspection } from "@/types";

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  scheduled:   "outline",
  in_progress: "warning",
  completed:   "success",
  cancelled:   "outline",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InspectionsPage() {
  const [search, setSearch] = useState("");

  const [{ data: mines = [] }, { data: inspections = [], isLoading }] = useQueries({
    queries: [
      { queryKey: ["mines"], queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]) },
      { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/").then((r) => r.data.items as Inspection[]) },
    ],
  });

  const mineMap = Object.fromEntries(mines.map((m) => [m.id, m.name]));

  const filtered = inspections.filter((ins) => {
    const mineName = mineMap[ins.mine_id] ?? ins.mine_id;
    return (
      mineName.toLowerCase().includes(search.toLowerCase()) ||
      ins.inspection_type.toLowerCase().includes(search.toLowerCase()) ||
      ins.status.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <PageHeader
        title="Inspections"
        description="Schedule and track mine inspections"
      />
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                className="pl-9"
                placeholder="Search inspections…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  {["Mine", "Type", "Status", "Scheduled", "Completed", "Findings"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No inspections found.</td></tr>
                ) : filtered.map((ins) => (
                  <tr key={ins.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer">
                    <td className="px-4 py-3 font-medium">{mineMap[ins.mine_id] ?? "Unknown Mine"}</td>
                    <td className="px-4 py-3 capitalize">{ins.inspection_type.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[ins.status] ?? "outline"}>
                        {ins.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(ins.scheduled_at)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(ins.completed_at)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-xs truncate">
                      {ins.findings ?? "—"}
                    </td>
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
