"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inspectionApi, authApi } from "@/lib/services";

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  scheduled: "outline", in_progress: "warning", completed: "success", cancelled: "outline",
};
const checklistVariant: Record<string, "success" | "danger" | "outline"> = {
  pass: "success", fail: "danger", na: "outline",
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
    </div>
  );
}

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: inspection, isLoading } = useQuery({
    queryKey: ["inspection", id],
    queryFn: () => inspectionApi.get(`/v1/inspections/${id}`).then((r) => r.data),
  });
  const { data: mines = [] } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]),
  });
  const mineMap = Object.fromEntries(mines.map((m) => [m.id, m.name]));

  return (
    <div>
      <PageHeader
        title="Inspection Detail"
        description="View inspection results and checklist"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton /></CardContent></Card>
      ) : !inspection ? (
        <Card><CardContent className="p-6 text-center text-[var(--muted-foreground)]">Inspection not found.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold capitalize">{inspection.inspection_type.replace("_", " ")} Inspection</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{mineMap[inspection.mine_id] ?? inspection.mine_id}</p>
                </div>
                <Badge variant={statusVariant[inspection.status] ?? "outline"}>
                  {inspection.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div><p className="text-xs text-[var(--muted-foreground)]">Scheduled</p><p className="font-medium">{fmt(inspection.scheduled_at)}</p></div>
                <div><p className="text-xs text-[var(--muted-foreground)]">Completed</p><p className="font-medium">{fmt(inspection.completed_at)}</p></div>
                <div><p className="text-xs text-[var(--muted-foreground)]">Inspector ID</p><p className="font-medium truncate">{inspection.inspector_id?.slice(0, 8)}…</p></div>
                <div><p className="text-xs text-[var(--muted-foreground)]">Type</p><p className="font-medium capitalize">{inspection.inspection_type.replace("_", " ")}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          {inspection.checklist_items?.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-sm font-semibold">Checklist Items</h3>
                <div className="space-y-2">
                  {inspection.checklist_items.map((item: any, i: number) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{item.description ?? item.title ?? `Item ${i + 1}`}</p>
                        {item.notes && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item.notes}</p>}
                      </div>
                      <Badge variant={checklistVariant[item.status?.toLowerCase()] ?? "outline"}>
                        {(item.status ?? "—").toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Findings */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" /> Findings
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-line">
                  {inspection.findings ?? "No findings recorded."}
                </p>
                {inspection.recommendations && (
                  <>
                    <h3 className="mt-4 mb-2 text-sm font-semibold">Recommendations</h3>
                    <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-line">{inspection.recommendations}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Camera className="h-4 w-4" /> Photo Attachments
                </h3>
                {inspection.photo_attachments?.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {inspection.photo_attachments.map((url: string, i: number) => (
                      <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-20 w-full rounded object-cover border border-[var(--border)]" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">No photos attached.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
