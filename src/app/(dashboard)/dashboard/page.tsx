"use client";
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ShieldCheck, AlertTriangle, ClipboardList, Activity,
  TrendingUp, HardHat, Brain, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { authApi, complianceApi, inspectionApi, violationApi, aiApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth";

const FIVE_MIN = 5 * 60 * 1000;

const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  critical: "danger", high: "warning", medium: "outline", low: "outline",
};

// ── Demo data (shown when API returns empty results) ──────────────────────────
const DEMO_MINES = [
  { id: "m1", name: "Jharia Coalfield Alpha" },
  { id: "m2", name: "Raniganj Central Block" },
  { id: "m3", name: "Bokaro Deep Mine" },
  { id: "m4", name: "Dhanbad North Pit" },
  { id: "m5", name: "Ramgarh Underground" },
  { id: "m6", name: "Giridih Open-cast" },
];

const DEMO_COMPLIANCE = [
  { id: "co1", mine_id: "m1", status: "compliant",     overall_score: "82", safety_score: "79", environmental_score: "85", labour_score: "83", period_start: "2026-04-01" },
  { id: "co2", mine_id: "m2", status: "compliant",     overall_score: "91", safety_score: "93", environmental_score: "88", labour_score: "92", period_start: "2026-04-01" },
  { id: "co3", mine_id: "m3", status: "non_compliant", overall_score: "54", safety_score: "48", environmental_score: "61", labour_score: "53", period_start: "2026-04-01" },
  { id: "co4", mine_id: "m4", status: "non_compliant", overall_score: "61", safety_score: "55", environmental_score: "68", labour_score: "60", period_start: "2026-04-01" },
  { id: "co5", mine_id: "m5", status: "compliant",     overall_score: "88", safety_score: "90", environmental_score: "86", labour_score: "88", period_start: "2026-04-01" },
  { id: "co6", mine_id: "m6", status: "non_compliant", overall_score: "72", safety_score: "66", environmental_score: "74", labour_score: "76", period_start: "2026-04-01" },
  // Previous months for trend
  { id: "co7",  mine_id: "m1", status: "compliant",     overall_score: "78", safety_score: "76", environmental_score: "81", labour_score: "77", period_start: "2026-03-01" },
  { id: "co8",  mine_id: "m2", status: "compliant",     overall_score: "87", safety_score: "89", environmental_score: "85", labour_score: "87", period_start: "2026-03-01" },
  { id: "co9",  mine_id: "m1", status: "compliant",     overall_score: "74", safety_score: "72", environmental_score: "77", labour_score: "73", period_start: "2026-02-01" },
  { id: "co10", mine_id: "m2", status: "compliant",     overall_score: "83", safety_score: "85", environmental_score: "80", labour_score: "84", period_start: "2026-02-01" },
  { id: "co11", mine_id: "m1", status: "non_compliant", overall_score: "68", safety_score: "64", environmental_score: "72", labour_score: "68", period_start: "2026-01-01" },
  { id: "co12", mine_id: "m2", status: "compliant",     overall_score: "80", safety_score: "82", environmental_score: "78", labour_score: "80", period_start: "2025-12-01" },
];

const DEMO_INSPECTIONS = [
  { id: "i1", mine_id: "m1", status: "scheduled",   created_at: "2026-09-05T10:00:00Z" },
  { id: "i2", mine_id: "m2", status: "scheduled",   created_at: "2026-09-05T10:00:00Z" },
  { id: "i3", mine_id: "m3", status: "completed",   created_at: "2026-09-01T10:00:00Z" },
  { id: "i4", mine_id: "m4", status: "in_progress", created_at: "2026-09-05T08:00:00Z" },
  { id: "i5", mine_id: "m5", status: "scheduled",   created_at: "2026-09-10T09:00:00Z" },
];

const DEMO_VIOLATIONS = [
  { id: "v1", mine_id: "m1", category: "safety",      severity: "critical", status: "open",         description: "Methane concentration exceeds 1.25% TLV at Face 14-C.",           created_at: "2026-09-05T08:00:00Z" },
  { id: "v2", mine_id: "m2", category: "environment", severity: "high",     status: "acknowledged", description: "Effluent discharge exceeds MOEF suspended solids limit by 4.8x.", created_at: "2026-09-04T14:00:00Z" },
  { id: "v3", mine_id: "m1", category: "safety",      severity: "high",     status: "open",         description: "PPE non-compliance — 18 workers at open-cast bench without helmets.", created_at: "2026-09-03T09:00:00Z" },
  { id: "v4", mine_id: "m3", category: "labour",      severity: "medium",   status: "resolved",     description: "Overtime hours exceeded statutory limit for 7 contract labourers.", created_at: "2026-08-31T10:00:00Z" },
  { id: "v5", mine_id: "m4", category: "safety",      severity: "critical", status: "open",         description: "Emergency escape route obstructed at Level-3.",                    created_at: "2026-09-05T07:00:00Z" },
  { id: "v6", mine_id: "m5", category: "environment", severity: "medium",   status: "acknowledged", description: "Dust emission exceeded 150 µg/m³ PM10 limit for 3 days.",           created_at: "2026-09-04T11:00:00Z" },
  { id: "v7", mine_id: "m2", category: "production",  severity: "low",      status: "resolved",     description: "Daily production log not submitted for 3 consecutive shifts.",       created_at: "2026-09-04T17:00:00Z" },
  { id: "v8", mine_id: "m6", category: "safety",      severity: "high",     status: "open",         description: "Winding engine operator found sleeping during shift.",               created_at: "2026-09-04T23:00:00Z" },
];

const DEMO_AI_ALERTS = [
  { title: "Risk spike at Korba Main Complex",      severity: "high",   confidence: 0.91 },
  { title: "Anomalous methane pattern — Jharia",    severity: "critical", confidence: 0.87 },
  { title: "Inspection lag exceeds 30 days",        severity: "medium", confidence: 0.79 },
  { title: "Contractor compliance score declining", severity: "medium", confidence: 0.74 },
  { title: "Labour overtime trend alert",           severity: "low",    confidence: 0.68 },
];
// ─────────────────────────────────────────────────────────────────────────────

// ── Skeleton ──────────────────────────────────────────────────────────────────
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: accent ?? "var(--primary)" }}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-[var(--muted-foreground)]">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Role gates ────────────────────────────────────────────────────────────────
const ADMIN_ROLES = new Set(["ADMIN"]);
const MANAGER_ROLES = new Set(["ADMIN", "MANAGER"]);

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // Normalise to uppercase — backend may return lowercase role strings
  const role = (user?.role ?? "VIEWER").toUpperCase();
  const isAdmin = ADMIN_ROLES.has(role);
  const isManagerOrAbove = MANAGER_ROLES.has(role);

  const [selectedMine, setSelectedMine] = useState<string>("all");

  // ── Data fetching ──────────────────────────────────────────────────────────
  const results = useQueries({
    queries: [
      { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/?size=200").then(r => r.data.items ?? r.data),                retry: false, refetchInterval: FIVE_MIN },
      { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/?size=200").then(r => r.data.items ?? []), retry: false, refetchInterval: FIVE_MIN },
      { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/?size=200").then(r => r.data.items ?? []), retry: false, refetchInterval: FIVE_MIN },
      { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/?size=200").then(r => r.data.items ?? []),   retry: false, refetchInterval: FIVE_MIN },
    ],
  });

  const { data: aiAlerts = [] } = useQuery<any[]>({
    queryKey: ["ai-alerts"],
    queryFn: () => aiApi.get("/v1/predictions/alerts").then(r => r.data.items ?? r.data).catch(() => []),
    refetchInterval: FIVE_MIN,
    retry: false,
    enabled: isManagerOrAbove,
  });

  const rawMines       = (results[0].data as any[]) ?? [];
  const rawCompliance  = (results[1].data as any[]) ?? [];
  const rawInspections = (results[2].data as any[]) ?? [];
  const rawViolations  = (results[3].data as any[]) ?? [];

  // Fall back to demo data when APIs return nothing
  const allMines       = rawMines.length       > 0 ? rawMines       : DEMO_MINES;
  const allCompliance  = rawCompliance.length  > 0 ? rawCompliance  : DEMO_COMPLIANCE;
  const allInspections = rawInspections.length > 0 ? rawInspections : DEMO_INSPECTIONS;
  const allViolations  = rawViolations.length  > 0 ? rawViolations  : DEMO_VIOLATIONS;


  // For non-admin users, restrict to their assigned mine
  const effectiveMine = !isAdmin && user?.mine_id ? user.mine_id : selectedMine;

  const mines       = allMines;
  const compliance  = effectiveMine === "all" ? allCompliance  : allCompliance.filter(r => r.mine_id === effectiveMine);
  const inspections = effectiveMine === "all" ? allInspections : allInspections.filter(i => i.mine_id === effectiveMine);
  const violations  = effectiveMine === "all" ? allViolations  : allViolations.filter(v => v.mine_id === effectiveMine);

  const isLoading = results.some(r => r.isLoading);
  const displayAiAlerts = aiAlerts.length > 0 ? aiAlerts : (isManagerOrAbove && !isLoading ? DEMO_AI_ALERTS : []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const mineCount          = effectiveMine === "all" ? mines.length : 1;
  const compliantMines     = compliance.filter(r => r.status === "compliant").length;
  const activeViolations   = violations.filter(v => v.status === "open").length;
  const pendingInspections = inspections.filter(i => i.status === "scheduled").length;
  const avgScore = compliance.length
    ? Math.round(compliance.reduce((s, r) => s + parseFloat(r.overall_score ?? 0), 0) / compliance.length * 10) / 10
    : 0;
  const criticalAlerts = violations.filter(v => v.severity === "critical" && v.status === "open").length;

  // Compliance trend — grouped by YYYY-MM key so sort is chronological
  const trendMap: Record<string, number[]> = {};
  compliance.forEach(r => {
    const d = new Date(r.period_start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    (trendMap[key] ??= []).push(parseFloat(r.overall_score ?? 0));
  });
  const complianceTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, scores]) => ({
      month: new Date(key + "-01").toLocaleString("default", { month: "short" }),
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

  // Violations by category
  const catMap: Record<string, number> = {};
  violations.forEach(v => { catMap[v.category] = (catMap[v.category] ?? 0) + 1; });
  const violationsByCategory = Object.entries(catMap).map(([name, count]) => ({ name, count }));

  // Risk distribution
  const riskColors: Record<string, string> = { low: "#2f6664", medium: "#b77a45", high: "#9e6636", critical: "#c0392b" };
  const sevMap: Record<string, number> = {};
  violations.forEach(v => { sevMap[v.severity] = (sevMap[v.severity] ?? 0) + 1; });
  const riskDistribution = Object.entries(sevMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: riskColors[name] ?? "#5b666c",
  }));

  // Per-mine risk scores (join compliance records to mines)
  const mineScoreMap: Record<string, number[]> = {};
  allCompliance.forEach(r => { (mineScoreMap[r.mine_id] ??= []).push(parseFloat(r.overall_score ?? 0)); });
  const mineRiskBars = mines.slice(0, 8).map(m => ({
    name: m.name?.slice(0, 16) ?? m.id.slice(0, 8),
    score: mineScoreMap[m.id]
      ? Math.round(mineScoreMap[m.id].reduce((a, b) => a + b, 0) / mineScoreMap[m.id].length)
      : 0,
  }));

  // Recent open violations
  const recentAlerts = violations
    .filter(v => v.status === "open")
    .slice(0, 5)
    .map(v => ({
      id: v.id,
      mine: mines.find((m: any) => m.id === v.mine_id)?.name ?? v.mine_id?.slice(0, 8) ?? "—",
      issue: v.description?.slice(0, 70) ?? "—",
      severity: v.severity ?? "low",
      time: v.created_at ? new Date(v.created_at).toLocaleDateString("en-IN") : "—",
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Header + mine selector */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description={`Overview · auto-refreshes every 5 min${isLoading ? " · loading…" : ""}`}
        />

        {isAdmin && mines.length > 0 && (
          <div className="relative">
            <select
              value={selectedMine}
              onChange={e => setSelectedMine(e.target.value)}
              className="appearance-none rounded-md border border-[var(--border)] bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
            >
              <option value="all">All Mines</option>
              {mines.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Mines"         value={mineCount}           icon={HardHat}       accent="#172126" />
            <StatCard title="Compliant"           value={compliantMines}      sub={`of ${compliance.length} records`} icon={ShieldCheck} accent="#2f6664" />
            <StatCard title="Active Violations"   value={activeViolations}    icon={AlertTriangle} accent="#b77a45" />
            <StatCard title="Pending Inspections" value={pendingInspections}  icon={ClipboardList} accent="#2f6664" />
            <StatCard title="Avg Compliance"      value={`${avgScore}%`}      icon={TrendingUp}    accent="#172126" />
            <StatCard title="Critical Alerts"     value={criticalAlerts}      icon={Activity}      accent="#c0392b" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Compliance Score Trend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : complianceTrend.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No compliance data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={complianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2f6664" strokeWidth={2.5} dot={{ r: 4, fill: "#172126" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : riskDistribution.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No violation data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value">
                    {riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend iconSize={10} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mine risk bars — admin/manager only */}
      {isManagerOrAbove && (
        <Card>
          <CardHeader><CardTitle>Mine Risk Scores</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[160px] w-full" />
            ) : mineRiskBars.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No mine data</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={mineRiskBars}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${Number(v)}%`, "Compliance Score"]} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}
                    fill="var(--secondary)"
                    label={false}
                  >
                    {mineRiskBars.map((entry, i) => (
                      <Cell key={i} fill={entry.score < 60 ? "#c0392b" : entry.score < 80 ? "#b77a45" : "#2f6664"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Violations by category */}
        <Card>
          <CardHeader><CardTitle>Violations by Category</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : violationsByCategory.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No violations</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={violationsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#b77a45" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent open violations */}
        <Card>
          <CardHeader><CardTitle>Recent Open Violations</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : recentAlerts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No open violations</p>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map(alert => (
                  <div key={alert.id} onClick={() => router.push(`/violations/${alert.id}`)} className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3 cursor-pointer hover:bg-[var(--stone)]/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{alert.mine}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{alert.issue}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant={severityVariant[alert.severity]}>{alert.severity.toUpperCase()}</Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI alerts — admin/manager only */}
        {isManagerOrAbove && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-[var(--secondary)]" />
                AI Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {displayAiAlerts.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No AI alerts</p>
              ) : (
                <div className="space-y-2">
                  {displayAiAlerts.slice(0, 5).map((alert: any, i: number) => (
                    <div key={i} className="rounded-md border border-[var(--border)] p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{alert.title ?? alert.message ?? "Risk detected"}</p>
                        <Badge variant={severityVariant[alert.severity ?? "medium"]}>{(alert.severity ?? "medium").toUpperCase()}</Badge>
                      </div>
                      {alert.confidence != null && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--secondary)]" style={{ width: `${Math.round(alert.confidence * 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{Math.round(alert.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
