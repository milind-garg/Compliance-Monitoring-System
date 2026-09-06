"use client";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { authApi, violationApi } from "@/lib/services";
import { TableSkeleton } from "@/components/ui/skeleton";
import { buildMineMap, getMineName } from "@/lib/mines";
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

// ── Demo data (shown when API returns no violations) ──────────────────────────
const DEMO_VIOLATIONS: Violation[] = [
  { id: "v1",  mine_id: "m1", inspection_id: null, category: "safety",      severity: "critical", status: "open",         description: "Methane concentration exceeds 1.25% TLV at Face 14-C, North Shaft. Immediate evacuation completed but source not yet sealed.", due_date: "2026-09-07", regulation_ref: "CMR 2017, Rule 162",          resolved_at: null, created_at: "2026-09-05T08:00:00Z" },
  { id: "v2",  mine_id: "m2", inspection_id: "i2", category: "environment", severity: "high",     status: "acknowledged", description: "Effluent discharge from washery pond breached permissible limit for suspended solids (480 mg/L vs 100 mg/L limit).",            due_date: "2026-09-12", regulation_ref: "MOEF Notification 2016",       resolved_at: null, created_at: "2026-09-04T14:00:00Z" },
  { id: "v3",  mine_id: "m1", inspection_id: "i1", category: "safety",      severity: "high",     status: "open",         description: "Personal Protective Equipment non-compliance observed in 18 workers at the open-cast bench area. Helmets absent.",              due_date: "2026-09-10", regulation_ref: "CMR 2017, Rule 43",            resolved_at: null, created_at: "2026-09-03T09:00:00Z" },
  { id: "v4",  mine_id: "m3", inspection_id: "i3", category: "labour",      severity: "medium",   status: "resolved",     description: "Overtime hours exceeded statutory limit (12 hrs/shift) for 7 contract labourers during peak blasting week.",                    due_date: "2026-08-31", regulation_ref: "Mines Act 1952, Sec 28",       resolved_at: "2026-09-02T10:00:00Z", created_at: "2026-08-28T10:00:00Z" },
  { id: "v5",  mine_id: "m4", inspection_id: null, category: "safety",      severity: "critical", status: "open",         description: "Emergency escape route obstructed at Level-3 of underground section due to equipment storage. Fire evacuation drill failed.",    due_date: "2026-09-06", regulation_ref: "CMR 2017, Rule 107",           resolved_at: null, created_at: "2026-09-05T07:00:00Z" },
  { id: "v6",  mine_id: "m5", inspection_id: null, category: "environment", severity: "medium",   status: "acknowledged", description: "Dust emission from haul road exceeded 150 µg/m³ PM10 limit on three consecutive monitoring days.",                               due_date: "2026-09-15", regulation_ref: "MOEF EP Act 1986",             resolved_at: null, created_at: "2026-09-04T11:00:00Z" },
  { id: "v7",  mine_id: "m2", inspection_id: null, category: "production",  severity: "low",      status: "resolved",     description: "Daily production log not submitted for 3 consecutive shifts — 02 Sept to 04 Sept 2026.",                                        due_date: "2026-09-05", regulation_ref: "Coal Mines Regulation, Rule 90", resolved_at: "2026-09-05T09:00:00Z", created_at: "2026-09-04T17:00:00Z" },
  { id: "v8",  mine_id: "m6", inspection_id: "i7", category: "safety",      severity: "high",     status: "open",         description: "Winding engine operator found sleeping during shift at Main Shaft — critical safety role unattended for ~40 minutes.",           due_date: "2026-09-09", regulation_ref: "CMR 2017, Rule 73",            resolved_at: null, created_at: "2026-09-04T23:00:00Z" },
  { id: "v9",  mine_id: "m1", inspection_id: "i6", category: "environment", severity: "low",      status: "closed",       description: "Tree plantation quota (50 trees) for Q2 FY 2025-26 not completed. Only 32 trees planted against statutory requirement.",         due_date: "2026-07-31", regulation_ref: "Forest Conservation Act 1980",  resolved_at: "2026-09-01T10:00:00Z", created_at: "2026-08-01T09:00:00Z" },
  { id: "v10", mine_id: "m3", inspection_id: null, category: "safety",      severity: "medium",   status: "open",         description: "First-aid kits at 4 surface workstations found expired / incomplete. Bandages, antiseptic, and tourniquet missing.",            due_date: "2026-09-13", regulation_ref: "CMR 2017, Rule 44(1)",          resolved_at: null, created_at: "2026-09-05T10:00:00Z" },
];

export default function ViolationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [minesQ, violationsQ] = useQueries({
    queries: [
      { queryKey: ["mines"], queryFn: () => authApi.get("/v1/mines/").then((r) => (r.data.items ?? r.data) as { id: string; name: string }[]) },
      { queryKey: ["violations"], queryFn: () => violationApi.get("/v1/violations/").then((r) => (r.data.items ?? r.data) as Violation[]) },
    ],
  });

  const mines = minesQ.data ?? [];
  const violations = violationsQ.data ?? [];
  const isLoading = minesQ.isLoading || violationsQ.isLoading;

  const mineMap = buildMineMap(mines);

  // Fall back to demo data when the API returns nothing
  const displayViolations = violations.length > 0 ? violations : DEMO_VIOLATIONS;
  const isDemo = violations.length === 0 && !isLoading;

  const filtered = displayViolations.filter((v) => {
    const mineName = getMineName(v.mine_id, mineMap);
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
        actions={
          isDemo ? (
            <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
              Demo data
            </span>
          ) : undefined
        }
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
            <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                  {["Description", "Mine", "Category", "Severity", "Status", "Due Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No violations found.</td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} onClick={() => router.push(`/violations/${v.id}`)} className="border-b border-[var(--border)] hover:bg-[var(--stone)]/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-[var(--foreground)]">{v.description}</p>
                      {v.regulation_ref && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{v.regulation_ref}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{getMineName(v.mine_id, mineMap)}</td>
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
