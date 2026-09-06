"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inspectionApi, authApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMineMap, getMineName } from "@/lib/mines";

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

function InspectionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Demo inspections fallback ───────────────────────────────────────────────
const DEMO_INSPECTIONS_MAP: Record<string, any> = {
  i1: { id: "i1", mine_id: "m1", inspector_id: "u3", inspection_type: "safety", status: "completed", scheduled_at: "2026-09-01T09:00:00Z", completed_at: "2026-09-01T14:30:00Z", findings: "3 PPE violations at North Bench. Emergency exit signage faded in 2 locations. Corrective actions issued.", recommendations: "Replace exit signage; enforce PPE checks at shift start.", checklist_items: [{ category: "Safety", item: "Personal Protective Equipment", status: "non_compliant" }, { category: "Safety", item: "Emergency Exits & Signage", status: "non_compliant" }, { category: "Ventilation", item: "Airflow Velocity & Direction", status: "compliant" }, { category: "Machinery", item: "Conveyor Belt Emergency Trip", status: "compliant" }] },
  i2: { id: "i2", mine_id: "m2", inspector_id: "u4", inspection_type: "environmental", status: "completed", scheduled_at: "2026-08-28T10:00:00Z", completed_at: "2026-08-28T16:00:00Z", findings: "Washery effluent TSS levels at 480 mg/L — exceeds MOEF 100 mg/L limit. SHOW CAUSE notice issued.", recommendations: "Install secondary settling pond. Submit compliance plan within 15 days.", checklist_items: [{ category: "Environment", item: "Effluent Discharge TSS", status: "non_compliant" }, { category: "Environment", item: "Air Quality PM10", status: "compliant" }, { category: "Environment", item: "Noise Levels", status: "compliant" }] },
  i3: { id: "i3", mine_id: "m3", inspector_id: "u3", inspection_type: "statutory", status: "completed", scheduled_at: "2026-08-22T08:30:00Z", completed_at: "2026-08-22T13:00:00Z", findings: "DGMS Form-III checklist 94% compliant. Minor gap in winding engine logbook entries for 3 days.", recommendations: "Maintain daily winding engine logbook without gaps.", checklist_items: [{ category: "Statutory", item: "DGMS Form-III Log", status: "compliant" }, { category: "Machinery", item: "Winding Engine Logbook", status: "non_compliant" }] },
  i4: { id: "i4", mine_id: "m4", inspector_id: "u7", inspection_type: "safety", status: "in_progress", scheduled_at: "2026-09-05T08:00:00Z", completed_at: null, findings: null, recommendations: null, checklist_items: [] },
  i5: { id: "i5", mine_id: "m5", inspector_id: "u3", inspection_type: "general", status: "scheduled", scheduled_at: "2026-09-10T09:00:00Z", completed_at: null, findings: null, recommendations: null, checklist_items: [] },
  i6: { id: "i6", mine_id: "m1", inspector_id: "u4", inspection_type: "environmental", status: "completed", scheduled_at: "2026-08-15T10:00:00Z", completed_at: "2026-08-15T15:00:00Z", findings: "Dust suppression system functional. PM10 levels within limits. Plantation quota partially met (64%).", recommendations: "Complete remaining 18 trees by Q3 deadline.", checklist_items: [{ category: "Environment", item: "Dust Suppression", status: "compliant" }] },
  i7: { id: "i7", mine_id: "m6", inspector_id: "u7", inspection_type: "safety", status: "completed", scheduled_at: "2026-08-10T09:00:00Z", completed_at: "2026-08-10T12:45:00Z", findings: "Critical: winding engine operator found sleeping. Methane detector calibration overdue by 18 days.", recommendations: "Immediate disciplinary action. Re-calibrate all methane detectors within 48 hours.", checklist_items: [{ category: "Safety", item: "Operator Fitness & Alertness", status: "non_compliant" }, { category: "Sensors", item: "Methane Detector Calibration", status: "non_compliant" }] },
  i8: { id: "i8", mine_id: "m2", inspector_id: "u3", inspection_type: "statutory", status: "scheduled", scheduled_at: "2026-09-15T08:00:00Z", completed_at: null, findings: null, recommendations: null, checklist_items: [] },
  i9: { id: "i9", mine_id: "m3", inspector_id: "u4", inspection_type: "safety", status: "cancelled", scheduled_at: "2026-08-05T09:00:00Z", completed_at: null, findings: "Cancelled due to heavy rainfall and risk of surface water ingress.", recommendations: null, checklist_items: [] },
  i10: { id: "i10", mine_id: "m4", inspector_id: "u7", inspection_type: "general", status: "completed", scheduled_at: "2026-07-29T09:00:00Z", completed_at: "2026-07-29T13:30:00Z", findings: "Overall compliance satisfactory. First-aid stations restocked. Haul road grading completed on schedule.", recommendations: "Schedule next inspection within 45 days.", checklist_items: [{ category: "General", item: "First-aid Stations", status: "compliant" }] },
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

const DEMO_USER_MAP: Record<string, string> = {
  u3: "Rajesh Kumar (Safety Inspector)",
  u4: "Dr. Ananya Roy (Environmental Officer)",
  u7: "Vikram Seth (DGMS Senior Inspector)",
};

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [showComplete, setShowComplete] = useState(false);
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const { data: rawInspection, isLoading } = useQuery({
    queryKey: ["inspection", id],
    queryFn: () => inspectionApi.get(`/v1/inspections/${id}`).then((r) => r.data),
    retry: false,
  });
  const { data: rawMines = [] } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]),
    retry: false,
  });
  const { data: rawUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => authApi.get("/v1/users/").then((r) => (r.data.items ?? r.data) as { id: string; full_name: string }[]),
    retry: false,
  });

  const inspection = rawInspection ?? (id ? DEMO_INSPECTIONS_MAP[id] : null);
  const mineMap = buildMineMap(rawMines);
  const apiUserMap = Object.fromEntries(rawUsers.map((u) => [u.id, u.full_name]));
  const userMap = Object.keys(apiUserMap).length > 0 ? apiUserMap : DEMO_USER_MAP;

  const startMutation = useMutation({
    mutationFn: () => inspectionApi.patch(`/v1/inspections/${id}`, { status: "in_progress" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inspection", id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => inspectionApi.patch(`/v1/inspections/${id}/complete`, { findings, recommendations }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspection", id] });
      qc.invalidateQueries({ queryKey: ["inspections"] });
      setShowComplete(false);
    },
  });

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
        <InspectionDetailSkeleton />
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
                  <p className="text-sm text-[var(--muted-foreground)]">{getMineName(inspection.mine_id, mineMap)}</p>
                </div>
                <Badge variant={statusVariant[inspection.status] ?? "outline"}>
                  {inspection.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div><p className="text-xs text-[var(--muted-foreground)]">Scheduled</p><p className="font-medium">{fmt(inspection.scheduled_at)}</p></div>
                <div><p className="text-xs text-[var(--muted-foreground)]">Completed</p><p className="font-medium">{fmt(inspection.completed_at)}</p></div>
                <div><p className="text-xs text-[var(--muted-foreground)]">Inspector</p><p className="font-medium">{userMap[inspection.inspector_id] ?? inspection.inspector_id?.slice(0, 8) + "…"}</p></div>
                <div><p className="text-xs text-[var(--muted-foreground)]">Type</p><p className="font-medium capitalize">{inspection.inspection_type.replace("_", " ")}</p></div>
              </div>

              {/* Action buttons */}
              {inspection.status === "scheduled" && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                    {startMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Start Inspection
                  </Button>
                </div>
              )}
              {inspection.status === "in_progress" && !showComplete && (
                <div className="mt-4">
                  <Button size="sm" onClick={() => setShowComplete(true)}>Complete Inspection</Button>
                </div>
              )}
              {inspection.status === "in_progress" && showComplete && (
                <div className="mt-4 space-y-3 rounded-md border border-[var(--border)] p-4">
                  <p className="text-sm font-medium">Complete Inspection</p>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Findings</label>
                    <textarea
                      value={findings}
                      onChange={e => setFindings(e.target.value)}
                      rows={3}
                      placeholder="Describe findings…"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Recommendations</label>
                    <textarea
                      value={recommendations}
                      onChange={e => setRecommendations(e.target.value)}
                      rows={2}
                      placeholder="Recommendations (optional)…"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || !findings.trim()}>
                      {completeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Submit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowComplete(false)}>Cancel</Button>
                  </div>
                </div>
              )}
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
                      // eslint-disable-next-line @next/next/no-img-element
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
