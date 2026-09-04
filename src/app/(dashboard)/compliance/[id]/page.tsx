"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, Building2, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { complianceApi, authApi } from "@/lib/services";

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

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded bg-[var(--muted)]" />
      <div className="h-4 w-full rounded bg-[var(--muted)]" />
      <div className="h-4 w-3/4 rounded bg-[var(--muted)]" />
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

export default function ComplianceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: record, isLoading, error } = useQuery({
    queryKey: ["compliance", id],
    queryFn: () => complianceApi.get(`/v1/compliance/${id}`).then((r) => r.data),
  });

  const { data: mines = [] } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]),
  });

  const mineMap = Object.fromEntries(mines.map((m) => [m.id, m.name]));

  return (
    <div>
      <PageHeader
        title="Compliance Detail"
        description="View compliance record details"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton /></CardContent></Card>
      ) : error || !record ? (
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

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                <InfoRow icon={Building2} label="Mine" value={mineMap[record.mine_id] ?? record.mine_id} />
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
