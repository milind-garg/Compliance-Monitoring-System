"use client";
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

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
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "VIEWER";
  const isAdmin = ADMIN_ROLES.has(role);
  const isManagerOrAbove = MANAGER_ROLES.has(role);

  const [selectedMine, setSelectedMine] = useState<string>("all");

  // ── Data fetching ──────────────────────────────────────────────────────────
  const results = useQueries({
    queries: [
      { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/").then(r => r.data),                retry: false, refetchInterval: FIVE_MIN },
      { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/").then(r => r.data.items ?? []), retry: false, refetchInterval: FIVE_MIN },
      { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/").then(r => r.data.items ?? []), retry: false, refetchInterval: FIVE_MIN },
      { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/").then(r => r.data.items ?? []),   retry: false, refetchInterval: FIVE_MIN },
    ],
  });

  const { data: aiAlerts = [] } = useQuery<any[]>({
    queryKey: ["ai-alerts"],
    queryFn: () => aiApi.get("/v1/predictions/alerts").then(r => r.data.items ?? r.data).catch(() => []),
    refetchInterval: FIVE_MIN,
    retry: false,
  });

  const allMines       = (results[0].data as any[]) ?? [];
  const allCompliance  = (results[1].data as any[]) ?? [];
  const allInspections = (results[2].data as any[]) ?? [];
  const allViolations  = (results[3].data as any[]) ?? [];

  // For non-admin users, restrict to their assigned mine
  const effectiveMine = !isAdmin && user?.mine_id ? user.mine_id : selectedMine;

  const mines       = allMines;
  const compliance  = effectiveMine === "all" ? allCompliance  : allCompliance.filter(r => r.mine_id === effectiveMine);
  const inspections = effectiveMine === "all" ? allInspections : allInspections.filter(i => i.mine_id === effectiveMine);
  const violations  = effectiveMine === "all" ? allViolations  : allViolations.filter(v => v.mine_id === effectiveMine);

  const isLoading = results.some(r => r.isLoading);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const compliantMines     = compliance.filter(r => r.status === "compliant").length;
  const activeViolations   = violations.filter(v => v.status === "open").length;
  const pendingInspections = inspections.filter(i => i.status === "scheduled").length;
  const avgScore = compliance.length
    ? Math.round(compliance.reduce((s, r) => s + parseFloat(r.overall_score ?? 0), 0) / compliance.length * 10) / 10
    : 0;
  const criticalAlerts = violations.filter(v => v.severity === "critical" && v.status === "open").length;

  // Compliance trend — grouped by month
  const trendMap: Record<string, number[]> = {};
  compliance.forEach(r => {
    const month = new Date(r.period_start).toLocaleString("default", { month: "short" });
    (trendMap[month] ??= []).push(parseFloat(r.overall_score ?? 0));
  });
  const complianceTrend = Object.entries(trendMap)
    .map(([month, scores]) => ({ month, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .slice(-6);

  // Violations by category
  const catMap: Record<string, number> = {};
  violations.forEach(v => { catMap[v.category] = (catMap[v.category] ?? 0) + 1; });
  const violationsByCategory = Object.entries(catMap).map(([name, count]) => ({ name, count }));

  // Risk distribution
  const riskColors: Record<string, string> = { low: "#27ae60", medium: "#f39c12", high: "#e67e22", critical: "#e74c3c" };
  const sevMap: Record<string, number> = {};
  violations.forEach(v => { sevMap[v.severity] = (sevMap[v.severity] ?? 0) + 1; });
  const riskDistribution = Object.entries(sevMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: riskColors[name] ?? "#999",
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
              className="appearance-none rounded-md border border-[var(--border)] bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
            <StatCard title="Total Mines"         value={mines.length}        icon={HardHat}       accent="#1e3a5f" />
            <StatCard title="Compliant"           value={compliantMines}      sub={`of ${compliance.length} records`} icon={ShieldCheck} accent="#27ae60" />
            <StatCard title="Active Violations"   value={activeViolations}    icon={AlertTriangle} accent="#e67e22" />
            <StatCard title="Pending Inspections" value={pendingInspections}  icon={ClipboardList} accent="#f39c12" />
            <StatCard title="Avg Compliance"      value={`${avgScore}%`}      icon={TrendingUp}    accent="#2980b9" />
            <StatCard title="Critical Alerts"     value={criticalAlerts}      icon={Activity}      accent="#e74c3c" />
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
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
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
                  <Tooltip formatter={(v: number) => [`${v}%`, "Compliance Score"]} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}
                    fill="var(--primary)"
                    // colour red below 60
                    label={false}
                  >
                    {mineRiskBars.map((entry, i) => (
                      <Cell key={i} fill={entry.score < 60 ? "#e74c3c" : entry.score < 80 ? "#f39c12" : "#27ae60"} />
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
                  <Bar dataKey="count" fill="#e67e22" radius={[0, 4, 4, 0]} />
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
                  <div key={alert.id} className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3">
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
                <Brain className="h-4 w-4 text-[var(--primary)]" />
                AI Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {aiAlerts.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No AI alerts</p>
              ) : (
                <div className="space-y-2">
                  {aiAlerts.slice(0, 5).map((alert: any, i: number) => (
                    <div key={i} className="rounded-md border border-[var(--border)] p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{alert.title ?? alert.message ?? "Risk detected"}</p>
                        <Badge variant={severityVariant[alert.severity ?? "medium"]}>{(alert.severity ?? "medium").toUpperCase()}</Badge>
                      </div>
                      {alert.confidence != null && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.round(alert.confidence * 100)}%` }} />
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
