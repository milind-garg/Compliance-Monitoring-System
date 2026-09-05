"use client";
import { useQueries } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, Loader2, Zap } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  LineChart, Line,
} from "recharts";
import { authApi, complianceApi, violationApi, inspectionApi, aiApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";

function riskVariant(level: string): "danger" | "warning" | "success" | "outline" {
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  if (level === "low") return "success";
  return "outline";
}

const CONF_COLOR = (c: number) => c >= 0.8 ? "#22c55e" : c >= 0.6 ? "#eab308" : "#f97316";

// ── Demo data (shown when API returns empty results) ──────────────────────────
const DEMO_RADAR_DATA = [
  { category: "Safety",        score: 72 },
  { category: "Environmental", score: 78 },
  { category: "Labour",        score: 80 },
  { category: "Overall",       score: 75 },
];

const DEMO_FACTORS_BAR = [
  { name: "Safety deficit",        value: 28 },
  { name: "Environmental deficit",  value: 22 },
  { name: "Inspection lag",         value: 45 },
  { name: "Open violations",        value: 60 },
  { name: "Labour deficit",         value: 20 },
];

const DEMO_FLEET_TREND = [
  { period: "12", score: 68 },
  { period: "01", score: 71 },
  { period: "02", score: 74 },
  { period: "03", score: 77 },
  { period: "04", score: 72 },
  { period: "05", score: 75 },
  { period: "06", score: 78 },
  { period: "07", score: 75 },
];

const DEMO_PREDICTIONS = [
  { mine_id: "m1", risk_score: 0.71, risk_level: "high",   confidence: 0.89, is_anomaly: false, name: "Jharia Coalfield Alpha" },
  { mine_id: "m2", risk_score: 0.31, risk_level: "low",    confidence: 0.94, is_anomaly: false, name: "Raniganj Central Block" },
  { mine_id: "m3", risk_score: 0.82, risk_level: "high",   confidence: 0.87, is_anomaly: true,  name: "Bokaro Deep Mine" },
  { mine_id: "m4", risk_score: 0.60, risk_level: "medium", confidence: 0.81, is_anomaly: false, name: "Dhanbad North Pit" },
  { mine_id: "m5", risk_score: 0.22, risk_level: "low",    confidence: 0.91, is_anomaly: false, name: "Ramgarh Underground" },
  { mine_id: "m6", risk_score: 0.55, risk_level: "medium", confidence: 0.76, is_anomaly: false, name: "Giridih Open-cast" },
];
// ─────────────────────────────────────────────────────────────────────────────



export default function AIInsightsPage() {
  const [minesQ, recordsQ, violationsQ, inspectionsQ] =
    useQueries({
      queries: [
        { queryKey: ["mines"],       queryFn: () => authApi.get("/v1/mines/").then(r => r.data),                                         retry: false },
        { queryKey: ["compliance"],  queryFn: () => complianceApi.get("/v1/compliance/?size=500").then(r => r.data.items ?? r.data),      retry: false },
        { queryKey: ["violations"],  queryFn: () => violationApi.get("/v1/violations/?size=500").then(r => r.data.items ?? r.data),       retry: false },
        { queryKey: ["inspections"], queryFn: () => inspectionApi.get("/v1/inspections/?size=500").then(r => r.data.items ?? r.data),     retry: false },
      ],
    });

  const mines = minesQ.data ?? [];
  const records = recordsQ.data ?? [];
  const violations = violationsQ.data ?? [];
  const inspections = inspectionsQ.data ?? [];

  // Latest compliance record per mine
  const latestPerMine: Record<string, any> = {};
  (records as any[]).forEach(r => {
    if (!latestPerMine[r.mine_id] || r.period_start > latestPerMine[r.mine_id].period_start)
      latestPerMine[r.mine_id] = r;
  });

  const openViolPerMine: Record<string, number> = {};
  (violations as any[]).filter((v: any) => v.status === "open").forEach((v: any) => {
    openViolPerMine[v.mine_id] = (openViolPerMine[v.mine_id] ?? 0) + 1;
  });

  const daysSinceInsp: Record<string, number> = {};
  (inspections as any[]).filter((i: any) => i.status === "completed").forEach((i: any) => {
    const days = Math.floor((Date.now() - new Date(i.completed_at!).getTime()) / 86400000);
    if (!daysSinceInsp[i.mine_id] || days < daysSinceInsp[i.mine_id]) daysSinceInsp[i.mine_id] = days;
  });

  const mineNames = Object.fromEntries((mines as any[]).map(m => [m.id, m.name]));
  const mineIds = Object.keys(latestPerMine);

  // Combined risk + anomaly per mine — parallel fetch, single query key
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
        queryFn: async () => {
          const [riskR, anomalyR] = await Promise.all([
            aiApi.post("/v1/predictions/risk", body),
            aiApi.post("/v1/predictions/anomaly", body),
          ]);
          return {
            mine_id: mid,
            ...riskR.data as { risk_score: number; risk_level: string; confidence: number },
            is_anomaly: (anomalyR.data as { is_anomaly: boolean }).is_anomaly,
          };
        },
        retry: false,
        enabled: mineIds.length > 0,
      };
    }),
  });

  const predictions = predictionQueries.map(q => q.data).filter(Boolean) as Array<{
    mine_id: string; risk_score: number; risk_level: string; confidence: number; is_anomaly: boolean;
  }>;

  const isDataLoading = minesQ.isLoading || recordsQ.isLoading || violationsQ.isLoading || inspectionsQ.isLoading;
  const isPredictionLoading = predictionQueries.some(q => q.isLoading);
  const isLoading = isDataLoading || isPredictionLoading;
  const aiDown = mineIds.length > 0 && !isLoading && predictionQueries.every(q => q.isError);

  // ── Fleet-average radar data ──────────────────────────────────────────────
  const radarDataRaw = (records as any[]).length > 0 ? [
    { category: "Safety",        score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.safety_score), 0)        / (records as any[]).length) },
    { category: "Environmental", score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.environmental_score), 0) / (records as any[]).length) },
    { category: "Labour",        score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.labour_score), 0)        / (records as any[]).length) },
    { category: "Overall",       score: Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.overall_score), 0)       / (records as any[]).length) },
  ] : [];
  const radarData = radarDataRaw.length > 0 ? radarDataRaw : DEMO_RADAR_DATA;

  // ── Contributing risk factors — derived from compliance dimension deficits ──
  const factorsBarRaw = (records as any[]).length > 0 ? [
    { name: "Safety deficit",        value: 100 - Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.safety_score), 0)        / (records as any[]).length) },
    { name: "Environmental deficit",  value: 100 - Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.environmental_score), 0) / (records as any[]).length) },
    { name: "Labour deficit",         value: 100 - Math.round((records as any[]).reduce((s, r) => s + parseFloat(r.labour_score), 0)        / (records as any[]).length) },
    { name: "Open violations",        value: Math.min(Math.round(Object.values(openViolPerMine).reduce((s, v) => s + v, 0) / Math.max(Object.keys(openViolPerMine).length, 1) * 10), 100) },
    { name: "Inspection lag",         value: Math.min(Math.round(Object.values(daysSinceInsp).reduce((s, v) => s + v, 0)    / Math.max(Object.keys(daysSinceInsp).length, 1) / 2), 100) },
  ].sort((a, b) => b.value - a.value) : [];
  const factorsBar = factorsBarRaw.length > 0 ? factorsBarRaw : DEMO_FACTORS_BAR;

  // ── Fleet-average compliance trend (all mines per month) ─────────────────
  const monthMap: Record<string, { sum: number; count: number }> = {};
  (records as any[]).forEach(r => {
    const month = r.period_start?.slice(0, 7) ?? "";
    if (!month) return;
    monthMap[month] = monthMap[month] ?? { sum: 0, count: 0 };
    monthMap[month].sum += parseFloat(r.overall_score);
    monthMap[month].count++;
  });
  const fleetTrendRaw = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([period, { sum, count }]) => ({ period: period.slice(5), score: Math.round(sum / count) }));
  const fleetTrend = fleetTrendRaw.length >= 2 ? fleetTrendRaw : DEMO_FLEET_TREND;

  // Use demo predictions when real ones are unavailable
  const displayPredictions = predictions.length > 0 ? predictions : (!isLoading && !aiDown ? DEMO_PREDICTIONS : []);
  const displayMineNames = { ...mineNames, m1: "Jharia Coalfield Alpha", m2: "Raniganj Central Block", m3: "Bokaro Deep Mine", m4: "Dhanbad North Pit", m5: "Ramgarh Underground", m6: "Giridih Open-cast" };

  const highRisk    = displayPredictions.filter(p => p.risk_level === "high").length;
  const anomalies   = displayPredictions.filter(p => p.is_anomaly).length;
  const avgConf     = displayPredictions.length ? Math.round(displayPredictions.reduce((s, p) => s + p.confidence * 100, 0) / displayPredictions.length) : 0;

  return (
    <div>
      <PageHeader title="AI Insights" description="Machine learning–powered risk predictions and anomaly detection" />

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))
        ) : (
          [
            { icon: <Brain className="h-5 w-5 text-[#2f6664]" />,       bg: "bg-[#2f6664]/15", label: "Mines Assessed",       value: displayPredictions.length },
            { icon: <TrendingUp className="h-5 w-5 text-[#172126]" />,   bg: "bg-[#172126]/10", label: "Avg Model Confidence", value: `${avgConf}%` },
            { icon: <AlertCircle className="h-5 w-5 text-[#b77a45]" />,  bg: "bg-[#b77a45]/15", label: "High-Risk Mines",   value: highRisk },
            { icon: <Zap className="h-5 w-5 text-[#c0392b]" />,         bg: "bg-red-50",       label: "Anomalies Detected",   value: anomalies },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Fleet compliance radar */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Fleet Compliance Radar</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[260px] items-center justify-center">
                <Skeleton className="h-[240px] w-[240px] rounded-full" />
              </div>
            ) : radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <Radar name="Score" dataKey="score" stroke="#2f6664" fill="#2f6664" fillOpacity={0.25} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-[var(--muted-foreground)]">No compliance data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Contributing factors bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Contributing Risk Factors</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-5 w-full rounded" />
                  </div>
                ))}
              </div>
            ) : factorsBar.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={factorsBar} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {factorsBar.map((entry, i) => (
                      <Cell key={i} fill={entry.value >= 60 ? "#c0392b" : entry.value >= 35 ? "#b77a45" : "#2f6664"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-[var(--muted-foreground)]">No factor data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Fleet compliance trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Fleet Compliance Trend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Skeleton className="h-[180px] w-full rounded-md" />
              </div>
            ) : fleetTrend.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={fleetTrend} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Line type="monotone" dataKey="score" stroke="#2f6664" strokeWidth={2.5} dot={{ r: 4, fill: "#172126" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-44 items-center justify-center text-sm text-[var(--muted-foreground)]">Need 2+ periods of data for trend</div>
            )}
          </CardContent>
        </Card>

        {/* Risk predictions per mine */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Risk Predictions per Mine</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-md border border-[var(--border)] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-1.5 w-3/4 rounded-full" />
                  </div>
                ))}
              </div>
            ) : displayPredictions.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-[var(--muted-foreground)]">
                No predictions yet — add compliance records first
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {[...displayPredictions].sort((a, b) => b.risk_score - a.risk_score).map(p => (
                  <div key={p.mine_id} className={`rounded-md border p-3 ${p.is_anomaly ? "border-[#b77a45]/60 bg-[#b77a45]/5" : "border-[var(--border)]"}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {p.is_anomaly && <Zap className="h-3.5 w-3.5 text-[#b77a45] flex-shrink-0" aria-label="Anomaly detected" />}
                        <p className="text-sm font-medium truncate">{(p as any).name ?? displayMineNames[p.mine_id] ?? p.mine_id.slice(0, 8) + "…"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.is_anomaly && <Badge variant="warning">ANOMALY</Badge>}
                        <Badge variant={riskVariant(p.risk_level)}>{p.risk_level.toUpperCase()}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-1.5 flex-1 rounded-full bg-[var(--muted)]">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round(p.risk_score * 100)}%`, background: p.risk_level === "high" ? "#e74c3c" : p.risk_level === "medium" ? "#f39c12" : "#27ae60" }} />
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                        {Math.round(p.risk_score * 100)}% risk
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-[var(--muted)]">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round(p.confidence * 100)}%`, background: CONF_COLOR(p.confidence) }} />
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                        {Math.round(p.confidence * 100)}% conf
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
