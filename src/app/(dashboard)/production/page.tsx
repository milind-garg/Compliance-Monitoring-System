"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, TrendingUp, Package, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { productionApi } from "@/lib/services";

type ProductionReport = {
  id: string;
  mine_id: string;
  date: string;
  shift: "day" | "night" | "general";
  tonnes_produced: number;
  ore_grade: number;
  equipment_hours: number;
  worker_count: number;
  notes: string | null;
  submitted_by: string;
  created_at: string;
};

type Stats = {
  total_tonnes: number;
  avg_grade: number;
  total_reports: number;
};

// ── Demo data (shown when API returns no records) ─────────────────────────────
const DEMO_REPORTS: ProductionReport[] = [
  { id: "p1",  mine_id: "m1", date: "2026-09-05", shift: "day",     tonnes_produced: 4820,  ore_grade: 68.4, equipment_hours: 18.5, worker_count: 142, notes: "Routine operation, conveyor belt maintenance scheduled for tonight.", submitted_by: "Rajesh Kumar",   created_at: "2026-09-05T08:00:00Z" },
  { id: "p2",  mine_id: "m1", date: "2026-09-05", shift: "night",   tonnes_produced: 3910,  ore_grade: 65.2, equipment_hours: 16.0, worker_count: 118, notes: "Slight delay due to blasting clearance at Sector 7-B.",             submitted_by: "Anita Sharma",    created_at: "2026-09-05T20:00:00Z" },
  { id: "p3",  mine_id: "m2", date: "2026-09-05", shift: "day",     tonnes_produced: 6130,  ore_grade: 71.8, equipment_hours: 22.0, worker_count: 205, notes: "Exceeded daily target by 8%. New shovel deployment successful.",    submitted_by: "Mohan Prasad",    created_at: "2026-09-05T09:15:00Z" },
  { id: "p4",  mine_id: "m3", date: "2026-09-04", shift: "general", tonnes_produced: 2250,  ore_grade: 62.1, equipment_hours: 14.0, worker_count: 97,  notes: "Pump failure in Level 3 reduced output by ~15%.",                   submitted_by: "Sunita Devi",     created_at: "2026-09-04T17:30:00Z" },
  { id: "p5",  mine_id: "m4", date: "2026-09-04", shift: "day",     tonnes_produced: 5480,  ore_grade: 69.9, equipment_hours: 20.5, worker_count: 178, notes: "Normal operations. DGMS checklist completed.",                       submitted_by: "Vikram Singh",    created_at: "2026-09-04T08:30:00Z" },
  { id: "p6",  mine_id: "m5", date: "2026-09-04", shift: "night",   tonnes_produced: 4190,  ore_grade: 66.7, equipment_hours: 17.5, worker_count: 131, notes: "Dust suppression system activated at 23:00 due to wind advisory.", submitted_by: "Priya Nair",      created_at: "2026-09-04T22:00:00Z" },
  { id: "p7",  mine_id: "m1", date: "2026-09-03", shift: "day",     tonnes_produced: 4650,  ore_grade: 67.5, equipment_hours: 19.0, worker_count: 140, notes: "Dragline ER-4 returned from maintenance.",                           submitted_by: "Rajesh Kumar",   created_at: "2026-09-03T08:00:00Z" },
  { id: "p8",  mine_id: "m2", date: "2026-09-03", shift: "day",     tonnes_produced: 5900,  ore_grade: 72.3, equipment_hours: 21.0, worker_count: 200, notes: "Record daily output this quarter.",                                  submitted_by: "Mohan Prasad",    created_at: "2026-09-03T08:45:00Z" },
  { id: "p9",  mine_id: "m6", date: "2026-09-03", shift: "general", tonnes_produced: 3120,  ore_grade: 60.8, equipment_hours: 15.0, worker_count: 112, notes: "Grade slightly lower due to mixed seam zone.",                       submitted_by: "Deepak Yadav",    created_at: "2026-09-03T17:00:00Z" },
  { id: "p10", mine_id: "m4", date: "2026-09-02", shift: "day",     tonnes_produced: 5250,  ore_grade: 70.2, equipment_hours: 20.0, worker_count: 175, notes: "Haul road grading completed. Equipment efficiency improved.",        submitted_by: "Vikram Singh",    created_at: "2026-09-02T09:00:00Z" },
];

const DEMO_STATS: Stats = {
  total_tonnes: DEMO_REPORTS.reduce((s, r) => s + r.tonnes_produced, 0),
  avg_grade: parseFloat((DEMO_REPORTS.reduce((s, r) => s + r.ore_grade, 0) / DEMO_REPORTS.length).toFixed(2)),
  total_reports: DEMO_REPORTS.length,
};
// ─────────────────────────────────────────────────────────────────────────────

const shiftVariant: Record<string, string> = {
  day:     "bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30",
  night:   "bg-[#2f6664]/15 text-[#1e4846] border border-[#2f6664]/30",
  general: "bg-[var(--stone)] text-[var(--foreground)] border border-[var(--border)]",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProductionPage() {
  const [search, setSearch] = useState("");

  const { data: reports = [], isLoading } = useQuery<ProductionReport[]>({
    queryKey: ["production"],
    queryFn: () => productionApi.get("/v1/production/").then((r) => r.data.items ?? r.data),
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["production-stats"],
    queryFn: () => productionApi.get("/v1/production/stats/summary").then((r) => r.data),
  });

  // Fall back to demo data when the API returns nothing
  const displayReports = reports.length > 0 ? reports : DEMO_REPORTS;
  const displayStats = stats ?? (reports.length === 0 && !isLoading ? DEMO_STATS : undefined);
  const isDemo = reports.length === 0 && !isLoading;

  const filtered = displayReports.filter(
    (r) =>
      r.date.includes(search) ||
      r.shift.includes(search.toLowerCase()) ||
      (r.notes ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Production Reports"
        description="Daily production tracking and shift data"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            <Button size="sm" variant="secondary">
              <Plus className="w-4 h-4 mr-1" /> New Report
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" /> Total Tonnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-2xl font-bold">{displayStats?.total_tonnes?.toLocaleString("en-IN") ?? "—"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Avg Ore Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{displayStats?.avg_grade?.toFixed(2) ?? "—"}%</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{displayStats?.total_reports ?? "—"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reports…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-10 ml-auto" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No production reports found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:border-[#2f6664]/60 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <p className="font-medium text-sm">{fmt(r.date)}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${shiftVariant[r.shift]}`}>
                      {r.shift} shift
                    </span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm shrink-0">
                  <div className="text-right">
                    <p className="font-semibold">{r.tonnes_produced.toLocaleString("en-IN")} t</p>
                    <p className="text-xs text-muted-foreground">produced</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{r.ore_grade.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">grade</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.worker_count}</p>
                    <p className="text-xs text-muted-foreground">workers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
