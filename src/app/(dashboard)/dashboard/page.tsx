"use client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ShieldCheck, AlertTriangle, ClipboardList, Activity, TrendingUp, HardHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types";

// Mock data until backend is ready
const mockStats: DashboardStats = {
  total_mines: 24,
  compliant_mines: 18,
  active_violations: 47,
  pending_inspections: 12,
  avg_compliance_score: 73.4,
  critical_alerts: 3,
};

const complianceTrend = [
  { month: "Mar", score: 65 },
  { month: "Apr", score: 68 },
  { month: "May", score: 71 },
  { month: "Jun", score: 69 },
  { month: "Jul", score: 74 },
  { month: "Aug", score: 73 },
];

const violationsByCategory = [
  { name: "Safety Equipment", count: 14 },
  { name: "Ventilation", count: 9 },
  { name: "Electrical", count: 8 },
  { name: "Fire Safety", count: 7 },
  { name: "Record Keeping", count: 9 },
];

const riskDistribution = [
  { name: "Low", value: 8, color: "#27ae60" },
  { name: "Medium", value: 9, color: "#f39c12" },
  { name: "High", value: 5, color: "#e67e22" },
  { name: "Critical", value: 2, color: "#e74c3c" },
];

const recentAlerts = [
  { id: "1", mine: "Jharia Block-A", issue: "Ventilation failure detected", severity: "CRITICAL", time: "10 min ago" },
  { id: "2", mine: "Raniganj North", issue: "Missing safety equipment records", severity: "HIGH", time: "1 hr ago" },
  { id: "3", mine: "Singrauli Zone-3", issue: "Inspection overdue by 14 days", severity: "MEDIUM", time: "3 hrs ago" },
];

const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "outline",
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: accent ?? "var(--primary)", opacity: 0.9 }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
          {sub && <p className="text-xs text-[var(--muted-foreground)]">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats = mockStats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get("/dashboard/stats")).data,
    // Silently fall back to mock data if backend unavailable
    retry: false,
    throwOnError: false,
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of coal mine compliance status across all sites"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <StatCard title="Total Mines" value={stats.total_mines} icon={HardHat} accent="#1e3a5f" />
        <StatCard
          title="Compliant Mines"
          value={stats.compliant_mines}
          sub={`of ${stats.total_mines}`}
          icon={ShieldCheck}
          accent="#27ae60"
        />
        <StatCard
          title="Active Violations"
          value={stats.active_violations}
          icon={AlertTriangle}
          accent="#e67e22"
        />
        <StatCard
          title="Pending Inspections"
          value={stats.pending_inspections}
          icon={ClipboardList}
          accent="#f39c12"
        />
        <StatCard
          title="Avg Compliance"
          value={`${stats.avg_compliance_score}%`}
          icon={TrendingUp}
          accent="#2980b9"
        />
        <StatCard
          title="Critical Alerts"
          value={stats.critical_alerts}
          icon={Activity}
          accent="#e74c3c"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        {/* Compliance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compliance Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconSize={10} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Violations by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Violations by Category</CardTitle>
          </CardHeader>
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

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{alert.mine}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{alert.issue}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
