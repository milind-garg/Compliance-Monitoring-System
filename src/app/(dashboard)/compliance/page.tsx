"use client";
import { useState, useMemo } from "react";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, Download, CheckSquare, Square, Minus, Loader2, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi, complianceApi, inspectionApi, violationApi } from "@/lib/services";
import { TableSkeleton } from "@/components/ui/skeleton";
import { buildMineMap, getMineName } from "@/lib/mines";

const statusVariant: Record<string, "success" | "danger" | "warning" | "outline"> = {
  compliant: "success", non_compliant: "danger", pending: "outline",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#2f6664" : score >= 60 ? "#b77a45" : "#c0392b";
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

function exportCSV(rows: any[], mineNames: Record<string, string>, violationsPerMine: Record<string, number>, lastInspection: Record<string, string>) {
  const header = ["Mine", "Status", "Overall Score", "Safety", "Environmental", "Labour", "Risk", "Open Violations", "Last Inspection"];
  const lines = rows.map(r => {
    const score = Math.round(parseFloat(r.overall_score));
    const risk = riskFromScore(score);
    const date = lastInspection[r.mine_id] ? new Date(lastInspection[r.mine_id]).toLocaleDateString() : "";
    return [
      mineNames[r.mine_id] ?? r.mine_id,
      r.status.replace("_", " ").toUpperCase(),
      score,
      Math.round(parseFloat(r.safety_score)),
      Math.round(parseFloat(r.environmental_score)),
      Math.round(parseFloat(r.labour_score)),
      risk.label,
      violationsPerMine[r.mine_id] ?? 0,
      date,
    ].join(",");
  });
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `compliance-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="120" height="96" viewBox="0 0 120 96" fill="none" className="mb-5 opacity-60">
        <rect x="10" y="20" width="100" height="60" rx="8" fill="var(--muted)" />
        <rect x="22" y="34" width="40" height="6" rx="3" fill="var(--muted-foreground)" opacity=".4" />
        <rect x="22" y="46" width="60" height="6" rx="3" fill="var(--muted-foreground)" opacity=".25" />
        <rect x="22" y="58" width="50" height="6" rx="3" fill="var(--muted-foreground)" opacity=".15" />
        <circle cx="93" cy="28" r="16" fill="var(--primary)" opacity=".15" />
        <path d="M87 28l4 4 6-6" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-base font-semibold text-[var(--foreground)]">No compliance records yet</p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-xs">
        Records appear here once compliance assessments are submitted for mine sites.
      </p>
    </div>
  );
}

// ── Demo data (shown when API returns no compliance records) ───────────────
const DEMO_COMPLIANCE_RECORDS = [
  { id: "c1", mine_id: "m1", overall_score: 82.0, safety_score: 85.0, environmental_score: 80.0, labour_score: 81.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c2", mine_id: "m2", overall_score: 68.0, safety_score: 72.0, environmental_score: 58.0, labour_score: 74.0, status: "non_compliant", period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c3", mine_id: "m3", overall_score: 88.0, safety_score: 90.0, environmental_score: 86.0, labour_score: 88.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c4", mine_id: "m4", overall_score: 61.0, safety_score: 58.0, environmental_score: 64.0, labour_score: 62.0, status: "non_compliant", period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c5", mine_id: "m5", overall_score: 79.0, safety_score: 82.0, environmental_score: 75.0, labour_score: 80.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c6", mine_id: "m6", overall_score: 54.0, safety_score: 52.0, environmental_score: 58.0, labour_score: 52.0, status: "non_compliant", period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c7", mine_id: "m7", overall_score: 92.0, safety_score: 95.0, environmental_score: 90.0, labour_score: 91.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c8", mine_id: "m8", overall_score: 76.0, safety_score: 78.0, environmental_score: 72.0, labour_score: 78.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
  { id: "c9", mine_id: "m9", overall_score: 85.0, safety_score: 88.0, environmental_score: 82.0, labour_score: 85.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z" },
];

const DEMO_MINE_MAP: Record<string, string> = {
  m1: "Jharia Coalfield Alpha",
  m2: "Raniganj Central Block",
  m3: "Bokaro Deep Mine",
  m4: "Dhanbad North Pit",
  m5: "Ramgarh Underground",
  m6: "Giridih Open-cast",
  m7: "Hazaribagh East Block",
  m8: "Korba Main Complex",
  m9: "Talcher Central Mine",
  m10: "Singrauli Alpha Seam",
};

const DEMO_VIOLATIONS_COUNT: Record<string, number> = {
  m1: 2, m2: 2, m3: 2, m4: 1, m5: 1, m6: 1,
};

const DEMO_LAST_INSPECTION: Record<string, string> = {
  m1: "2026-09-01T14:30:00Z",
  m2: "2026-08-28T16:00:00Z",
  m3: "2026-08-22T13:00:00Z",
  m4: "2026-07-29T13:30:00Z",
  m5: "2026-08-18T11:00:00Z",
  m6: "2026-08-10T12:45:00Z",
  m7: "2026-08-20T10:00:00Z",
  m8: "2026-08-14T15:00:00Z",
  m9: "2026-08-24T12:00:00Z",
};
// ─────────────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [minesQ, recordsQ, inspectionsQ, violationsQ] =
    useQueries({
      queries: [
        { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/").then(r => r.data),                                retry: false },
        { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/").then(r => r.data.items ?? r.data),     retry: false },
        { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/").then(r => r.data.items ?? r.data),    retry: false },
        { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/").then(r => r.data.items ?? r.data),      retry: false },
      ],
    });

  const rawMines = minesQ.data ?? [];
  const rawRecords = recordsQ.data ?? [];
  const rawInspections = inspectionsQ.data ?? [];
  const rawViolations = violationsQ.data ?? [];
  const isLoading = minesQ.isLoading || recordsQ.isLoading;

  const records = rawRecords.length > 0 ? rawRecords : DEMO_COMPLIANCE_RECORDS;
  const mineNames = buildMineMap(rawMines as any[]);

  const latestPerMine: Record<string, any> = useMemo(() => {
    const acc: Record<string, any> = {};
    (records as any[]).forEach(r => {
      if (!acc[r.mine_id] || r.period_start > acc[r.mine_id].period_start) acc[r.mine_id] = r;
    });
    return acc;
  }, [records]);

  const violationsPerMine: Record<string, number> = useMemo(() => {
    if (rawViolations.length === 0) return DEMO_VIOLATIONS_COUNT;
    const acc: Record<string, number> = {};
    (rawViolations as any[]).filter((v: any) => v.status === "open").forEach((v: any) => {
      acc[v.mine_id] = (acc[v.mine_id] ?? 0) + 1;
    });
    return acc;
  }, [rawViolations]);

  const lastInspection: Record<string, string> = useMemo(() => {
    if (rawInspections.length === 0) return DEMO_LAST_INSPECTION;
    const acc: Record<string, string> = {};
    (rawInspections as any[]).filter((i: any) => i.status === "completed").forEach((i: any) => {
      if (!acc[i.mine_id] || i.completed_at > acc[i.mine_id]) acc[i.mine_id] = i.completed_at;
    });
    return acc;
  }, [rawInspections]);

  const rows = useMemo(() => Object.values(latestPerMine) as any[], [latestPerMine]);

  const filtered = useMemo(() => rows.filter(r => {
    const name = getMineName(r.mine_id, mineNames);
    return name.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase());
  }), [rows, mineNames, search]);

  // ── Bulk approve ──────────────────────────────────────────────────────────
  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => complianceApi.patch(`/v1/compliance/${id}`, { status: "compliant" })));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compliance"] }); setSelected(new Set()); },
  });

  // Selection helpers
  const allFilteredIds = filtered.map(r => r.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected = allFilteredIds.some(id => selected.has(id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) { const next = new Set(selected); allFilteredIds.forEach(id => next.delete(id)); setSelected(next); }
    else { setSelected(new Set([...selected, ...allFilteredIds])); }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectedInFiltered = allFilteredIds.filter(id => selected.has(id));

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        description="Monitor compliance status across all mine sites"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(filtered, mineNames, violationsPerMine, lastInspection)}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input className="pl-9" placeholder="Search mines…" value={search} onChange={e => { setSearch(e.target.value); setSelected(new Set()); }} />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} records</span>

            {selectedInFiltered.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-[var(--muted-foreground)]">{selectedInFiltered.length} selected</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => bulkApprove.mutate(selectedInFiltered)}
                  disabled={bulkApprove.isPending}
                >
                  {bulkApprove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                  Bulk Approve
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                    <th className="px-4 py-3 w-10" />
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Mine</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Overall Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Safety</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Environmental</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Labour</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Risk</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--foreground)]">Open Violations</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Last Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  <TableSkeleton rows={6} cols={10} />
                </tbody>
              </table>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                    <th className="px-4 py-3 w-10">
                      <button onClick={toggleAll} className="flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        {allSelected ? <CheckSquare className="h-4 w-4 text-[#2f6664]" /> : someSelected ? <Minus className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Mine</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Overall Score</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Safety</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Environmental</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Labour</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Risk</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--foreground)]">Open Violations</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Last Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[var(--muted-foreground)]">
                        No records match your search
                      </td>
                    </tr>
                  ) : filtered.map(r => {
                    const score = Math.round(parseFloat(r.overall_score));
                    const risk = riskFromScore(score);
                    const date = lastInspection[r.mine_id] ? new Date(lastInspection[r.mine_id]).toLocaleDateString() : "—";
                    const isSelected = selected.has(r.id);
                    return (
                      <tr key={r.id} onClick={() => router.push(`/compliance/${r.id}`)} className={`border-b border-[var(--border)] hover:bg-[var(--stone)]/40 transition-colors cursor-pointer ${isSelected ? "bg-[#2f6664]/10" : ""}`}>
                        <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleRow(r.id); }}>
                          <button className="flex items-center justify-center text-[var(--muted-foreground)] hover:text-[#2f6664]">
                            {isSelected ? <CheckSquare className="h-4 w-4 text-[#2f6664]" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium">{mineNames[r.mine_id] ?? r.mine_id.slice(0, 8) + "…"}</td>
                        <td className="px-4 py-3"><Badge variant={statusVariant[r.status] ?? "outline"}>{r.status.replace("_", " ").toUpperCase()}</Badge></td>
                        <td className="px-4 py-3"><ScoreBar score={score} /></td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{Math.round(parseFloat(r.safety_score))}%</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{Math.round(parseFloat(r.environmental_score))}%</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{Math.round(parseFloat(r.labour_score))}%</td>
                        <td className="px-4 py-3"><Badge variant={risk.variant}>{risk.label}</Badge></td>
                        <td className="px-4 py-3 text-center">{violationsPerMine[r.mine_id] ?? 0}</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
