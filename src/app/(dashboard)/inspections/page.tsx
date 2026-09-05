"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { authApi, inspectionApi } from "@/lib/services";
import { TableSkeleton } from "@/components/ui/skeleton";
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

// ── Demo data (shown when API returns no inspections) ─────────────────────────
const DEMO_INSPECTIONS: Inspection[] = [
  { id: "i1",  mine_id: "m1", inspector_id: "u3", inspection_type: "safety",        status: "completed",   scheduled_at: "2026-09-01T09:00:00Z", completed_at: "2026-09-01T14:30:00Z", findings: "3 PPE violations at North Bench. Emergency exit signage faded in 2 locations. Corrective actions issued.", recommendations: "Replace exit signage; enforce PPE checks at shift start.", created_at: "2026-08-25T10:00:00Z" },
  { id: "i2",  mine_id: "m2", inspector_id: "u4", inspection_type: "environmental", status: "completed",   scheduled_at: "2026-08-28T10:00:00Z", completed_at: "2026-08-28T16:00:00Z", findings: "Washery effluent TSS levels at 480 mg/L — exceeds MOEF 100 mg/L limit. SHOW CAUSE notice issued.", recommendations: "Install secondary settling pond. Submit compliance plan within 15 days.", created_at: "2026-08-20T09:00:00Z" },
  { id: "i3",  mine_id: "m3", inspector_id: "u3", inspection_type: "statutory",     status: "completed",   scheduled_at: "2026-08-22T08:30:00Z", completed_at: "2026-08-22T13:00:00Z", findings: "DGMS Form-III checklist 94% compliant. Minor gap in winding engine logbook entries for 3 days.", recommendations: "Maintain daily winding engine logbook without gaps.", created_at: "2026-08-15T08:00:00Z" },
  { id: "i4",  mine_id: "m4", inspector_id: "u7", inspection_type: "safety",        status: "in_progress", scheduled_at: "2026-09-05T08:00:00Z", completed_at: null, findings: null, recommendations: null, created_at: "2026-09-03T10:00:00Z" },
  { id: "i5",  mine_id: "m5", inspector_id: "u3", inspection_type: "general",       status: "scheduled",   scheduled_at: "2026-09-10T09:00:00Z", completed_at: null, findings: null, recommendations: null, created_at: "2026-09-04T09:00:00Z" },
  { id: "i6",  mine_id: "m1", inspector_id: "u4", inspection_type: "environmental", status: "completed",   scheduled_at: "2026-08-15T10:00:00Z", completed_at: "2026-08-15T15:00:00Z", findings: "Dust suppression system functional. PM10 levels within limits. Plantation quota partially met (64%).", recommendations: "Complete remaining 18 trees by Q3 deadline.", created_at: "2026-08-10T09:00:00Z" },
  { id: "i7",  mine_id: "m6", inspector_id: "u7", inspection_type: "safety",        status: "completed",   scheduled_at: "2026-08-10T09:00:00Z", completed_at: "2026-08-10T12:45:00Z", findings: "Critical: winding engine operator found sleeping. Methane detector calibration overdue by 18 days.", recommendations: "Immediate disciplinary action. Re-calibrate all methane detectors within 48 hours.", created_at: "2026-08-05T08:00:00Z" },
  { id: "i8",  mine_id: "m2", inspector_id: "u3", inspection_type: "statutory",     status: "scheduled",   scheduled_at: "2026-09-15T08:00:00Z", completed_at: null, findings: null, recommendations: null, created_at: "2026-09-05T09:00:00Z" },
  { id: "i9",  mine_id: "m3", inspector_id: "u4", inspection_type: "safety",        status: "cancelled",   scheduled_at: "2026-08-05T09:00:00Z", completed_at: null, findings: "Cancelled due to heavy rainfall and risk of surface water ingress.", recommendations: null, created_at: "2026-07-30T09:00:00Z" },
  { id: "i10", mine_id: "m4", inspector_id: "u7", inspection_type: "general",       status: "completed",   scheduled_at: "2026-07-29T09:00:00Z", completed_at: "2026-07-29T13:30:00Z", findings: "Overall compliance satisfactory. First-aid stations restocked. Haul road grading completed on schedule.", recommendations: "Schedule next inspection within 45 days.", created_at: "2026-07-25T09:00:00Z" },
];

const DEMO_MINE_MAP: Record<string, string> = {
  m1: "Jharia Coalfield Alpha",
  m2: "Raniganj Central Block",
  m3: "Bokaro Deep Mine",
  m4: "Dhanbad North Pit",
  m5: "Ramgarh Underground",
  m6: "Giridih Open-cast",
};
// ─────────────────────────────────────────────────────────────────────────────

export default function InspectionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [minesQ, inspectionsQ] = useQueries({
    queries: [
      { queryKey: ["mines"], queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]) },
      { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/").then((r) => (r.data.items ?? r.data) as Inspection[]) },
    ],
  });

  const mines = minesQ.data ?? [];
  const inspections = inspectionsQ.data ?? [];
  const isLoading = minesQ.isLoading || inspectionsQ.isLoading;

  const apiMineMap = Object.fromEntries(mines.map((m) => [m.id, m.name]));

  // Fall back to demo data when the API returns nothing
  const displayInspections = inspections.length > 0 ? inspections : DEMO_INSPECTIONS;
  const mineMap = Object.keys(apiMineMap).length > 0 ? apiMineMap : DEMO_MINE_MAP;
  const isDemo = inspections.length === 0 && !isLoading;

  const filtered = displayInspections.filter((ins) => {
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
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            <Button size="sm" variant="secondary" onClick={() => router.push("/inspections/conduct")}>
              <Plus className="h-4 w-4 mr-1" /> Conduct Inspection
            </Button>
          </div>
        }
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
            <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                  {["Mine", "Type", "Status", "Scheduled", "Completed", "Findings"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No inspections found.</td></tr>
                ) : filtered.map((ins) => (
                  <tr key={ins.id} onClick={() => router.push(`/inspections/${ins.id}`)} className="border-b border-[var(--border)] hover:bg-[var(--stone)]/40 cursor-pointer transition-colors">
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
