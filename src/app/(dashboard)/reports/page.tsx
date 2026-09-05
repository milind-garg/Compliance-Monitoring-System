"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi, reportApi } from "@/lib/services";

type ReportType = "compliance" | "inspection" | "violation";

interface ReportItem {
  id: string;
  title: string;
  report_type: ReportType;
  mine_id: string | null;
  status: string;
  file_size: number | null;
  error: string | null;
  created_at: string;
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

// ── Demo data (shown when API returns no reports) ─────────────────────────────
const DEMO_REPORTS: ReportItem[] = [
  { id: "r1", title: "Q2 FY 2025-26 Compliance Summary — All Mines",    report_type: "compliance", mine_id: null, status: "ready",      file_size: 2621440,  error: null, created_at: "2026-09-05T10:00:00Z" },
  { id: "r2", title: "September 2026 Safety Inspection Report",          report_type: "inspection", mine_id: "m1", status: "ready",      file_size: 1572864,  error: null, created_at: "2026-09-05T09:30:00Z" },
  { id: "r3", title: "Open Violations Summary — Jharia Coalfield Alpha", report_type: "violation",  mine_id: "m1", status: "ready",      file_size: 819200,   error: null, created_at: "2026-09-04T16:00:00Z" },
  { id: "r4", title: "Raniganj Central Block — Environmental Compliance", report_type: "compliance", mine_id: "m2", status: "ready",      file_size: 1048576,  error: null, created_at: "2026-09-04T14:30:00Z" },
  { id: "r5", title: "August 2026 Inspection Summary — All Mines",       report_type: "inspection", mine_id: null, status: "ready",      file_size: 3145728,  error: null, created_at: "2026-09-01T08:00:00Z" },
  { id: "r6", title: "Labour Compliance Report — Q2 FY 2025-26",         report_type: "compliance", mine_id: null, status: "generating", file_size: null,     error: null, created_at: "2026-09-05T18:00:00Z" },
  { id: "r7", title: "Korba Main Complex — Critical Violations Report",  report_type: "violation",  mine_id: "m8", status: "ready",      file_size: 716800,   error: null, created_at: "2026-08-30T12:00:00Z" },
  { id: "r8", title: "DGMS Form-III Export — July 2026",                 report_type: "compliance", mine_id: null, status: "failed",     file_size: null,     error: "Template data missing for 3 mines. Re-run after updating compliance records.", created_at: "2026-08-28T10:00:00Z" },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const qc = useQueryClient();
  const [reportType, setReportType] = useState<ReportType>("compliance");
  const [mineId, setMineId] = useState("");
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: mines = [] } = useQuery<Mine[]>({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data),
  });

  const { data: reports = [], isLoading, error: listError } = useQuery<ReportItem[]>({
    queryKey: ["reports"],
    queryFn: () => reportApi.get("/v1/reports/").then((r) => r.data),
  });

  // Fall back to demo data when the API returns nothing
  const displayReports = reports.length > 0 ? reports : DEMO_REPORTS;
  const isDemo = reports.length === 0 && !isLoading;

  const generate = useMutation({
    mutationFn: () =>
      reportApi.post("/v1/reports/generate", {
        report_type: reportType,
        mine_id: mineId || null,
        title: title || null,
        period_start: periodStart || null,
        period_end: periodEnd || null,
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
    setDownloadError(null);
    reportApi
      .get(`/v1/reports/${id}/download`, { responseType: "blob" })
      .then((r) => {
        const url = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportTitle.replace(/\s+/g, "_")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => setDownloadError("Download failed. The report file may be unavailable."));
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and download compliance reports as PDF"
        actions={
          isDemo ? (
            <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
              Demo data
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Generate panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Generate Report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Report Type</label>
              <select
                className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
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
                className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
              >
                <option value="">All Mines</option>
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">From (optional)</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">To (optional)</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Custom Title (optional)</label>
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                placeholder={typeLabel[reportType]}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <Button variant="secondary" className="w-full" onClick={() => generate.mutate()} disabled={generate.isPending}>
              {generate.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
                : <><FileText className="h-4 w-4 mr-2" />Generate PDF</>}
            </Button>
            {generate.isError && (
              <p className="text-xs text-[var(--danger)]">Failed to generate report. Please try again.</p>
            )}
          </CardContent>
        </Card>

        {/* Reports list */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Reports</CardTitle></CardHeader>
          <CardContent className="p-0">
            {downloadError && (
              <p className="px-4 pt-3 text-xs text-[var(--danger)]">{downloadError}</p>
            )}
            {isLoading ? (
              <div className="divide-y divide-[var(--border)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-5 w-5 rounded shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {displayReports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--stone)]/40 transition-colors">
                    <FileText className="h-5 w-5 flex-shrink-0 text-[var(--muted-foreground)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {typeLabel[r.report_type as ReportType] ?? r.report_type} · {fmtSize(r.file_size)} · {fmtDate(r.created_at)}
                      </p>
                      {r.status === "failed" && (
                        <p className="text-xs text-[var(--danger)] mt-0.5">{r.error ?? "Generation failed."}</p>
                      )}
                    </div>
                    <Badge variant={r.status === "ready" ? "success" : r.status === "failed" ? "danger" : "outline"}>
                      {r.status}
                    </Badge>
                    {r.status === "ready" && (
                      <Button variant="ghost" size="icon" onClick={() => download(r.id, r.title)} title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(r.id)}
                      disabled={remove.isPending}
                      className="text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                      title="Delete report"
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
