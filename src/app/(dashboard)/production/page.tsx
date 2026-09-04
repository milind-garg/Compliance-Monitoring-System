"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, TrendingUp, Package, Users, Clock } from "lucide-react";
import api from "@/lib/api";

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

const shiftVariant: Record<string, string> = {
  day: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  night: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProductionPage() {
  const [search, setSearch] = useState("");

  const { data: reports = [], isLoading } = useQuery<ProductionReport[]>({
    queryKey: ["production"],
    queryFn: () => api.get("/api/v1/production/").then((r) => r.data.items ?? r.data),
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["production-stats"],
    queryFn: () => api.get("/api/v1/production/stats/summary").then((r) => r.data),
  });

  const filtered = reports.filter(
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
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Report
          </Button>
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
            <p className="text-2xl font-bold">{stats?.total_tonnes?.toLocaleString("en-IN") ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Avg Ore Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.avg_grade?.toFixed(2) ?? "—"}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total_reports ?? "—"}</p>
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
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No production reports found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:border-primary/50 transition-colors cursor-pointer">
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
