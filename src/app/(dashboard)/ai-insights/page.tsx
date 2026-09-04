"use client";
import { useQueries, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { authApi, complianceApi, violationApi, inspectionApi, aiApi } from "@/lib/services";

function riskVariant(level: string): "danger" | "warning" | "success" | "outline" {
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  if (level === "low") return "success";
  return "outline";
}

export default function AIInsightsPage() {
  // Fetch raw data
  const [{ data: mines = [] }, { data: records = [] }, { data: violations = [] }, { data: inspections = [] }] =
    useQueries({
      queries: [
        { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/").then(r => r.data),            retry: false },
        { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/?size=500").then(r => r.data.items ?? r.data),  retry: false },
        { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/?size=500").then(r => r.data.items ?? r.data),   retry: false },
        { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/?size=500").then(r => r.data.items ?? r.data), retry: false },
      ],
    });

  // Latest compliance record per mine
  const latestPerMine: Record<string, any> = {};
  (records as any[]).forEach(r => {
    if (!latestPerMine[r.mine_id] || r.period_start > latestPerMine[r.mine_id].period_start)
      latestPerMine[r.mine_id] = r;
  });

  // Open violations per mine
  const openViolPerMine: Record<string, number> = {};
  (violations as any[]).filter((v: any) => v.status === "open").forEach((v: any) => {
    openViolPerMine[v.mine_id] = (openViolPerMine[v.mine_id] ?? 0) + 1;
  });

  // Days since last completed inspection per mine
  const daysSinceInsp: Record<string, number> = {};
  (inspections as any[]).filter((i: any) => i.status === "completed").forEach((i: any) => {
    const days = Math.floor((Date.now() - new Date(i.completed_at!).getTime()) / 86400000);
    if (!daysSinceInsp[i.mine_id] || days < daysSinceInsp[i.mine_id])
      daysSinceInsp[i.mine_id] = days;
  });

  const mineNames = Object.fromEntries((mines as any[]).map(m => [m.id, m.name]));

  // Build prediction inputs for each mine that has a compliance record
  const mineIds = Object.keys(latestPerMine);

  const predictionQueries = useQueries({
    queries: mineIds.map(mid => {
      const rec = latestPerMine[mid];
      const body = {
        overall_score: parseFloat(rec.overall_score),
        safety_score: parseFloat(rec.safety_score),
        environmental_score: parseFloat(rec.environmental_score),
        labour_score: parseFloat(rec.labour_score),
        open_violations: openViolPerMine[mid] ?? 0,
        days_since_last_inspection: daysSinceInsp[mid] ?? 60,
      };
      return {
        queryKey: ["prediction", mid],
        queryFn: () => aiApi.post("/v1/predictions/risk", body).then(r => ({ mine_id: mid, ...r.data })),
        retry: false,
        enabled: mineIds.length > 0,
      };
    }),
  });

  const predictions = predictionQueries
    .map(q => q.data)
    .filter(Boolean) as Array<{ mine_id: string; risk_score: number; risk_level: string; confidence: number }>;

  const isLoading = predictionQueries.some(q => q.isLoading);

  // Radar: fleet-average scores by dimension
  const radarData = records.length > 0
    ? [
        { category: "Safety",       score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.safety_score), 0) / records.length) },
        { category: "Environmental", score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.environmental_score), 0) / records.length) },
        { category: "Labour",       score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.labour_score), 0) / records.length) },
        { category: "Overall",      score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.overall_score), 0) / records.length) },
      ]
    : [];

  const highRisk  = predictions.filter(p => p.risk_level === "high").length;
  const avgConf   = predictions.length ? Math.round(predictions.reduce((s, p) => s + p.confidence * 100, 0) / predictions.length) : 0;

  return (
    <div>
      <PageHeader title="AI Insights" description="Machine learning-powered risk predictions and anomaly detection" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Mines Assessed</p>
            <p className="text-xl font-bold">{predictions.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Avg Model Confidence</p>
            <p className="text-xl font-bold">{avgConf}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">High-Risk Mines</p>
            <p className="text-xl font-bold">{highRisk}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fleet Compliance Radar</CardTitle></CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <Radar name="Score" dataKey="score" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-[var(--muted-foreground)]">
                No compliance data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Predictions per Mine</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center gap-2 text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Running predictions…
              </div>
            ) : predictions.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-[var(--muted-foreground)]">
                No predictions yet — add compliance records first
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {predictions
                  .sort((a, b) => b.risk_score - a.risk_score)
                  .map(p => (
                    <div key={p.mine_id} className="rounded-md border border-[var(--border)] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium truncate">{mineNames[p.mine_id] ?? p.mine_id.slice(0, 8) + "…"}</p>
                        <Badge variant={riskVariant(p.risk_level)}>{p.risk_level.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-[var(--muted)]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round(p.risk_score * 100)}%`,
                              background: p.risk_level === "high" ? "#e74c3c" : p.risk_level === "medium" ? "#f39c12" : "#27ae60",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                          {Math.round(p.risk_score * 100)}% risk · {Math.round(p.confidence * 100)}% conf
                        </span>
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
