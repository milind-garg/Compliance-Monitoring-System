"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const radarData = [
  { category: "Ventilation", score: 70 },
  { category: "Fire Safety", score: 85 },
  { category: "Equipment", score: 60 },
  { category: "Record Keeping", score: 90 },
  { category: "Training", score: 75 },
  { category: "Electrical", score: 65 },
];

const predictions = [
  { mine: "Jharia Block-A", prediction: "HIGH risk of violation in Ventilation within 30 days", confidence: 87, severity: "HIGH" },
  { mine: "Raniganj North", prediction: "Inspection score likely to drop below 60% by Oct 2026", confidence: 73, severity: "MEDIUM" },
  { mine: "Bokaro Sector-2", prediction: "Equipment safety compliance improving — LOW risk", confidence: 81, severity: "LOW" },
];

export default function AIInsightsPage() {
  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Machine learning-powered risk predictions and anomaly detection"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Models Active</p>
            <p className="text-xl font-bold">4</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Avg Model Accuracy</p>
            <p className="text-xl font-bold">82%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Anomalies Detected</p>
            <p className="text-xl font-bold">7</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compliance Radar — Fleet Average</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <Radar name="Score" dataKey="score" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Predictions (30-day)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.map((p, i) => (
                <div key={i} className="rounded-md border border-[var(--border)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{p.mine}</p>
                    <Badge variant={p.severity === "HIGH" ? "danger" : p.severity === "MEDIUM" ? "warning" : "success"}>
                      {p.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{p.prediction}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{ width: `${p.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{p.confidence}% confidence</span>
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
