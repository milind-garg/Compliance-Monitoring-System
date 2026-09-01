"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const reports = [
  { id: "1", name: "Monthly Compliance Report — August 2026", type: "PDF", size: "2.4 MB", created: "2026-09-01" },
  { id: "2", name: "Violation Summary Q3 2026", type: "Excel", size: "1.1 MB", created: "2026-08-30" },
  { id: "3", name: "Inspection Log — Aug 2026", type: "PDF", size: "3.7 MB", created: "2026-08-28" },
  { id: "4", name: "Risk Assessment Report — Jharia Cluster", type: "PDF", size: "1.8 MB", created: "2026-08-15" },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and download compliance reports"
        actions={<Button size="sm"><FileText className="h-4 w-4" />Generate Report</Button>}
      />
      <Card>
        <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-[var(--border)] px-4 py-3 hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[var(--muted-foreground)]" />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{r.type} · {r.size} · {r.created}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
