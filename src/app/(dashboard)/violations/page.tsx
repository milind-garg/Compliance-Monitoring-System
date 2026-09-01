"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import type { Violation } from "@/types";

const mockViolations: Violation[] = [
  { id: "1", mine_id: "m1", mine_name: "Jharia Block-A", title: "Missing dust suppression equipment", description: "Section 4B lacks required dust suppression systems.", status: "OPEN", severity: "CRITICAL", created_at: "2026-08-20", due_date: "2026-09-05", assigned_to: "Rajesh Kumar" },
  { id: "2", mine_id: "m2", mine_name: "Raniganj North", title: "Inadequate ventilation in tunnel C", description: "Air quality readings below DGMS standards.", status: "IN_PROGRESS", severity: "HIGH", created_at: "2026-08-22", due_date: "2026-09-10", assigned_to: "Priya Singh" },
  { id: "3", mine_id: "m3", mine_name: "Singrauli Zone-3", title: "Expired fire extinguishers", description: "12 units past service date in zone 3.", status: "OPEN", severity: "MEDIUM", created_at: "2026-08-25", due_date: "2026-09-15" },
  { id: "4", mine_id: "m4", mine_name: "Dhanbad East", title: "Incomplete training records", description: "Safety training records for 8 workers missing.", status: "RESOLVED", severity: "LOW", created_at: "2026-08-01", due_date: "2026-08-20" },
];

const statusVariant: Record<string, "danger" | "warning" | "success" | "outline"> = {
  OPEN: "danger",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "outline",
};
const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "outline",
  LOW: "outline",
};

export default function ViolationsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockViolations.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.mine_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Violations"
        description="Track and resolve compliance violations"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Violation
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input className="pl-9" placeholder="Search violations…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  {["Title", "Mine", "Severity", "Status", "Due Date", "Assigned To"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium">{v.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{v.description}</p>
                    </td>
                    <td className="px-4 py-3">{v.mine_name}</td>
                    <td className="px-4 py-3"><Badge variant={severityVariant[v.severity]}>{v.severity}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[v.status]}>{v.status.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{v.due_date}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{v.assigned_to ?? "—"}</td>
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
