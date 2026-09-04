"use client";
import { useQueries } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { ShieldCheck, AlertTriangle, ClipboardList, Activity, TrendingUp, HardHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { authApi, complianceApi, inspectionApi, violationApi } from "@/lib/services";

const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  critical: "danger", high: "warning", medium: "outline", low: "outline",
};

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

export default function DashboardPage() {
  const results = useQueries({
    queries: [
      { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/").then(r => r.data),       retry: false },
      { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/").then(r => r.data.items), retry: false },
      { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/").then(r => r.data.items), retry: false },
      { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/").then(r => r.data.items),  retry: false },
    ],
  });

  const mines       = (results[0].data as any[]) ?? [];
  const compliance  = (results[1].data as any[]) ?? [];
  const inspections = (results[2].data as any[]) ?? [];
  const violations  = (results[3].data as any[]) ?? [];

  // Derived stats
  const compliantMines    = compliance.filter(r => r.status === "compliant").length;
  const activeViolations  = violations.filter(v => v.status === "open").length;
  const pendingInspections = inspections.filter(i => i.status === "scheduled").length;
  const avgScore = compliance.length
    ? Math.round(compliance.reduce((s, r) => s + parseFloat(r.overall_score), 0) / compliance.length * 10) / 10
    : 0;
  const criticalAlerts = violations.filter(v => v.severity === "critical" && v.status === "open").length;

  // Compliance trend — group records by month
  const trendMap: Record<string, number[]> = {};
  compliance.forEach(r => {
    const month = new Date(r.period_start).toLocaleString("default", { month: "short" });
    trendMap[month] = trendMap[month] ?? [];
    trendMap[month].push(parseFloat(r.overall_score));
  });
  const complianceTrend = Object.entries(trendMap).map(([month, scores]) => ({
    month,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  })).slice(-6);

  // Violations by category
  const catMap: Record<string, number> = {};
  violations.forEach(v => { catMap[v.category] = (catMap[v.category] ?? 0) + 1; });
  const violationsByCategory = Object.entries(catMap).map(([name, count]) => ({ name, count }));

  // Risk distribution from violations severity
  const riskColors = { low: "#27ae60", medium: "#f39c12", high: "#e67e22", critical: "#e74c3c" };
  const sevMap: Record<string, number> = {};
  violations.forEach(v => { sevMap[v.severity] = (sevMap[v.severity] ?? 0) + 1; });
  const riskDistribution = Object.entries(sevMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: riskColors[name as keyof typeof riskColors] ?? "#999",
  }));

  // Recent open violations as alerts
  const recentAlerts = violations
    .filter(v => v.status === "open")
    .slice(0, 5)
    .map(v => ({
      id: v.id,
      mine: v.mine_id.slice(0, 8),
      issue: v.description.slice(0, 70),
      severity: v.severity.toUpperCase(),
      time: new Date(v.created_at).toLocaleDateString(),
    }));

  const isLoading = results.some(r => r.isLoading);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of Khanan Bodh status across all sites" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <StatCard title="Total Mines"        value={isLoading ? "…" : mines.length}          icon={HardHat}        accent="#1e3a5f" />
        <StatCard title="Compliant Mines"    value={isLoading ? "…" : compliantMines}         sub={`of ${compliance.length} records`} icon={ShieldCheck} accent="#27ae60" />
        <StatCard title="Active Violations"  value={isLoading ? "…" : activeViolations}       icon={AlertTriangle}  accent="#e67e22" />
        <StatCard title="Pending Inspections" value={isLoading ? "…" : pendingInspections}    icon={ClipboardList}  accent="#f39c12" />
        <StatCard title="Avg Compliance"     value={isLoading ? "…" : `${avgScore}%`}         icon={TrendingUp}     accent="#2980b9" />
        <StatCard title="Critical Alerts"    value={isLoading ? "…" : criticalAlerts}         icon={Activity}       accent="#e74c3c" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Compliance Score Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value">
                  {riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend iconSize={10} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Violations by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={violationsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#e67e22" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Open Violations</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {recentAlerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No open violations</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Mine {alert.mine}…</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{alert.issue}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant={severityVariant[alert.severity.toLowerCase()]}>{alert.severity}</Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
