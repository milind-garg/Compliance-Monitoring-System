"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, Building2, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { complianceApi, authApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMineMap, getMineName } from "@/lib/mines";

const statusVariant: Record<string, "success" | "danger" | "warning" | "outline"> = {
  compliant: "success",
  non_compliant: "danger",
  pending: "outline",
  under_review: "warning",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ComplianceDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-[var(--muted)] p-3 text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-20" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
      <div>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// ── Demo compliance detail lookup ──────────────────────────────────────────
const DEMO_COMPLIANCE_DETAILS: Record<string, any> = {
  c1: { id: "c1", mine_id: "m1", overall_score: 82.0, safety_score: 85.0, environmental_score: 80.0, labour_score: 81.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T10:00:00Z", notes: "Monthly DGMS compliance verification passed. Air quality monitoring within normal parameters.", evidence_urls: ["https://example.com/reports/jharia-aug-safety.pdf", "https://example.com/reports/jharia-env-assessment.pdf"] },
  c2: { id: "c2", mine_id: "m2", overall_score: 68.0, safety_score: 72.0, environmental_score: 58.0, labour_score: 74.0, status: "non_compliant", period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T11:00:00Z", notes: "Environmental score impacted due to washery effluent exceeding limits. Remediation notice issued.", evidence_urls: ["https://example.com/reports/raniganj-effluent-test.pdf"] },
  c3: { id: "c3", mine_id: "m3", overall_score: 88.0, safety_score: 90.0, environmental_score: 86.0, labour_score: 88.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T12:00:00Z", notes: "High performance on safety and statutory inspections. Logbooks up to date.", evidence_urls: ["https://example.com/reports/bokaro-audit.pdf"] },
  c4: { id: "c4", mine_id: "m4", overall_score: 61.0, safety_score: 58.0, environmental_score: 64.0, labour_score: 62.0, status: "non_compliant", period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T13:00:00Z", notes: "Multiple overdue safety inspection items and escape route maintenance required.", evidence_urls: [] },
  c5: { id: "c5", mine_id: "m5", overall_score: 79.0, safety_score: 82.0, environmental_score: 75.0, labour_score: 80.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T14:00:00Z", notes: "Ventilation and haul road dust suppression compliant.", evidence_urls: ["https://example.com/reports/ramgarh-q2.pdf"] },
  c6: { id: "c6", mine_id: "m6", overall_score: 54.0, safety_score: 52.0, environmental_score: 58.0, labour_score: 52.0, status: "non_compliant", period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T15:00:00Z", notes: "Critical safety non-compliances flagged. DGMS inspection follow-up pending.", evidence_urls: [] },
  c7: { id: "c7", mine_id: "m7", overall_score: 92.0, safety_score: 95.0, environmental_score: 90.0, labour_score: 91.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T16:00:00Z", notes: "Exemplary compliance rating. Clean audit across all statutory parameters.", evidence_urls: ["https://example.com/reports/hazaribagh-excellence.pdf"] },
  c8: { id: "c8", mine_id: "m8", overall_score: 76.0, safety_score: 78.0, environmental_score: 72.0, labour_score: 78.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T17:00:00Z", notes: "Opencast slope stability tests passed. Dust suppression active.", evidence_urls: [] },
  c9: { id: "c9", mine_id: "m9", overall_score: 85.0, safety_score: 88.0, environmental_score: 82.0, labour_score: 85.0, status: "compliant",     period_start: "2026-08-01T00:00:00Z", period_end: "2026-08-31T23:59:59Z", created_at: "2026-09-01T18:00:00Z", notes: "Environmental clearances validated. Green belt plantation on track.", evidence_urls: ["https://example.com/reports/talcher-env.pdf"] },
};

const DEMO_MINE_MAP: Record<string, string> = {
  m1: "Jharia Coalfield Alpha",
  m2: "Raniganj Central Block",
  m3: "Bokaro Deep Mine",
  m4: "Dhanbad North Pit",
  m5: "Ramgarh Underground",
  m6: "Giridih Open-cast",
  m7: "Hazaribagh East Block",
  m8: "Korba Main Complex",
  m9: "Talcher Central Mine",
  m10: "Singrauli Alpha Seam",
};

export default function ComplianceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: rawRecord, isLoading } = useQuery({
    queryKey: ["compliance", id],
    queryFn: () => complianceApi.get(`/v1/compliance/${id}`).then((r) => r.data),
    retry: false,
  });

  const { data: rawMines = [] } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]),
    retry: false,
  });

  const record = rawRecord ?? (id ? DEMO_COMPLIANCE_DETAILS[id] : null);
  const mineMap = buildMineMap(rawMines);

  return (
    <div>
      <PageHeader
        title="Compliance Detail"
        description="View compliance record details"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <ComplianceDetailSkeleton />
      ) : !record ? (
        <Card><CardContent className="p-6 text-center text-[var(--muted-foreground)]">Failed to load compliance record.</CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{mineMap[record.mine_id] ?? record.mine_id}</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Period: {fmt(record.period_start)} – {fmt(record.period_end)}</p>
                  </div>
                  <Badge variant={statusVariant[record.status] ?? "outline"}>
                    {record.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--primary)]">{Math.round(parseFloat(record.overall_score))}%</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Overall Score</p>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
                    <p className="text-2xl font-bold">{Math.round(parseFloat(record.safety_score))}%</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Safety</p>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
                    <p className="text-2xl font-bold">{Math.round(parseFloat(record.environmental_score))}%</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Environmental</p>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
                    <p className="text-2xl font-bold">{Math.round(parseFloat(record.labour_score))}%</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Labour</p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 rounded-md border border-[var(--border)] p-3">
                    <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Notes</p>
                    <p className="text-sm">{record.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-sm font-semibold">Evidence Files</h3>
                {record.evidence_files?.length ? (
                  <ul className="space-y-2">
                    {record.evidence_files.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                        <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">No evidence files attached.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold">Details</h3>
                <InfoRow icon={Building2} label="Mine" value={getMineName(record.mine_id, mineMap)} />
                <InfoRow icon={Calendar} label="Period Start" value={fmt(record.period_start)} />
                <InfoRow icon={Calendar} label="Period End" value={fmt(record.period_end)} />
                {record.reviewed_by && <InfoRow icon={User} label="Reviewed By" value={record.reviewed_by} />}
              </CardContent>
            </Card>

            {/* Approval timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-sm font-semibold">Approval Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Submitted", done: true, date: fmt(record.period_start) },
                    { label: "Under Review", done: ["under_review", "compliant", "non_compliant"].includes(record.status), date: null },
                    { label: "Decision", done: ["compliant", "non_compliant"].includes(record.status), date: record.reviewed_at ? fmt(record.reviewed_at) : null },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${step.done ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />
                      <div>
                        <p className="text-sm font-medium">{step.label}</p>
                        {step.date && <p className="text-xs text-[var(--muted-foreground)]">{step.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
