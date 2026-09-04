"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { authApi, reportApi } from "@/lib/services";

type ReportType = "compliance" | "inspection" | "violation";

interface ReportItem {
  id: string;
  title: string;
  report_type: ReportType;
  mine_id: string | null;
  status: string;
  file_size: number | null;
  created_at: string;
  error: string | null;
}

interface Mine { id: string; name: string; }

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const typeLabel: Record<ReportType, string> = {
  compliance: "Compliance Summary",
  inspection: "Inspection Report",
  violation: "Violation Summary",
};

export default function ReportsPage() {
  const qc = useQueryClient();
  const [reportType, setReportType] = useState<ReportType>("compliance");
  const [mineId, setMineId] = useState("");
  const [title, setTitle] = useState("");

  const { data: mines = [] } = useQuery<Mine[]>({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data),
  });

  const { data: reports = [], isLoading } = useQuery<ReportItem[]>({
    queryKey: ["reports"],
    queryFn: () => reportApi.get("/v1/reports/").then((r) => r.data),
  });

  const generate = useMutation({
    mutationFn: () =>
      reportApi.post("/v1/reports/generate", {
        report_type: reportType,
        mine_id: mineId || null,
        title: title || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      setTitle("");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => reportApi.delete(`/v1/reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  const download = (id: string, reportTitle: string) => {
    reportApi
      .get(`/v1/reports/${id}/download`, { responseType: "blob" })
      .then((r) => {
        const url = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportTitle.replace(/\s+/g, "_")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and download compliance reports as PDF"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Generate Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Report Type</label>
              <select
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                <option value="compliance">Compliance Summary</option>
                <option value="inspection">Inspection Report</option>
                <option value="violation">Violation Summary</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mine (optional)</label>
              <select
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
              >
                <option value="">All Mines</option>
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Custom Title (optional)</label>
              <input
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                placeholder={typeLabel[reportType]}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              {generate.isPending ? "Generating…" : "Generate PDF"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Reports</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
            ) : reports.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">No reports yet. Generate one to get started.</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)] transition-colors">
                    <FileText className="h-5 w-5 flex-shrink-0 text-[var(--muted-foreground)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {typeLabel[r.report_type as ReportType] ?? r.report_type} · {fmtSize(r.file_size)} · {fmtDate(r.created_at)}
                      </p>
                      {r.status === "failed" && (
                        <p className="text-xs text-[var(--danger)] mt-0.5">{r.error}</p>
                      )}
                    </div>
                    <Badge variant={r.status === "ready" ? "success" : r.status === "failed" ? "danger" : "outline"}>
                      {r.status}
                    </Badge>
                    {r.status === "ready" && (
                      <Button variant="ghost" size="icon" onClick={() => download(r.id, r.title)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(r.id)}
                      className="text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
