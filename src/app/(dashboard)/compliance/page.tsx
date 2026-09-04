"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Search, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi, complianceApi, inspectionApi, violationApi } from "@/lib/services";

const statusVariant: Record<string, "success" | "danger" | "warning" | "outline"> = {
  compliant: "success",
  non_compliant: "danger",
  pending: "outline",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#27ae60" : score >= 60 ? "#f39c12" : "#e74c3c";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-[var(--muted)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );
}

function riskFromScore(score: number) {
  if (score >= 80) return { label: "LOW",      variant: "success" as const };
  if (score >= 65) return { label: "MEDIUM",   variant: "warning" as const };
  if (score >= 50) return { label: "HIGH",     variant: "warning" as const };
  return             { label: "CRITICAL",  variant: "danger"  as const };
}

export default function CompliancePage() {
  const [search, setSearch] = useState("");

  const [{ data: mines = [] }, { data: records = [] }, { data: inspections = [] }, { data: violations = [] }] =
    useQueries({
      queries: [
        { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/").then(r => r.data),           retry: false },
        { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/").then(r => r.data.items), retry: false },
        { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/").then(r => r.data.items), retry: false },
        { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/").then(r => r.data.items),  retry: false },
      ],
    });

  // Build lookup maps
  const mineNames = Object.fromEntries((mines as any[]).map(m => [m.id, m.name]));

  // Latest compliance record per mine
  const latestPerMine: Record<string, any> = {};
  (records as any[]).forEach(r => {
    if (!latestPerMine[r.mine_id] || r.period_start > latestPerMine[r.mine_id].period_start)
      latestPerMine[r.mine_id] = r;
  });

  // Open violations per mine
  const violationsPerMine: Record<string, number> = {};
  (violations as any[]).filter((v: any) => v.status === "open").forEach((v: any) => {
    violationsPerMine[v.mine_id] = (violationsPerMine[v.mine_id] ?? 0) + 1;
  });

  // Latest completed inspection per mine
  const lastInspection: Record<string, string> = {};
  (inspections as any[]).filter((i: any) => i.status === "completed").forEach((i: any) => {
    if (!lastInspection[i.mine_id] || i.completed_at > lastInspection[i.mine_id])
      lastInspection[i.mine_id] = i.completed_at;
  });

  const rows = Object.values(latestPerMine) as any[];

  const filtered = rows.filter(r => {
    const name = mineNames[r.mine_id] ?? r.mine_id;
    return name.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        description="Monitor compliance status across all mine sites"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input className="pl-9" placeholder="Search mines…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Mine</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Overall Score</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Safety</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Environmental</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Risk</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--muted-foreground)]">Open Violations</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Last Inspection</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const score = Math.round(parseFloat(r.overall_score));
                  const risk = riskFromScore(score);
                  const date = lastInspection[r.mine_id]
                    ? new Date(lastInspection[r.mine_id]).toLocaleDateString()
                    : "—";
                  return (
                    <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium">{mineNames[r.mine_id] ?? r.mine_id.slice(0, 8) + "…"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[r.status] ?? "outline"}>
                          {r.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><ScoreBar score={score} /></td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{Math.round(parseFloat(r.safety_score))}%</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{Math.round(parseFloat(r.environmental_score))}%</td>
                      <td className="px-4 py-3"><Badge variant={risk.variant}>{risk.label}</Badge></td>
                      <td className="px-4 py-3 text-center">{violationsPerMine[r.mine_id] ?? 0}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[var(--muted-foreground)]">
                {rows.length === 0 ? "No compliance records yet" : "No records match your search"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
