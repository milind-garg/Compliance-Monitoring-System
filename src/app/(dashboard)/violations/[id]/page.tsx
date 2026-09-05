"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, AlertTriangle, UserCheck, ChevronDown, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { violationApi, authApi } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<string, "danger" | "warning" | "success" | "outline"> = {
  open: "danger", acknowledged: "warning", resolved: "success", closed: "outline",
};
const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  critical: "danger", high: "warning", medium: "outline", low: "outline",
};

// Status machine: what transitions are available from each state
const NEXT_STATUS: Record<string, { label: string; value: string }[]> = {
  open:         [{ label: "Acknowledge", value: "acknowledged" }],
  acknowledged: [{ label: "Mark Resolved", value: "resolved" }],
  resolved:     [{ label: "Close", value: "closed" }],
  closed:       [],
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ViolationDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24 ml-1" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <div className="rounded-md border border-[var(--border)] p-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-28" />
            <div className="space-y-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-3 w-3 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
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

// ── Mini-map via OSM embed iframe ─────────────────────────────────────────────
function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const delta = 0.01;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div className="rounded-md overflow-hidden border border-[var(--border)]">
      <iframe
        src={src}
        width="100%"
        height="200"
        loading="lazy"
        title="Violation location"
        className="block"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--primary)] hover:underline border-t border-[var(--border)]"
      >
        <MapPin className="h-3 w-3" /> {lat.toFixed(5)}, {lng.toFixed(5)} — Open in map
      </a>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: "open",         label: "Reported" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved",     label: "Resolved" },
  { key: "closed",       label: "Closed" },
];
const STATUS_ORDER: Record<string, number> = { open: 0, acknowledged: 1, resolved: 2, closed: 3 };

function Timeline({ violation }: { violation: any }) {
  const currentOrder = STATUS_ORDER[violation.status] ?? 0;

  const dateFor = (key: string) => {
    if (key === "open") return violation.created_at;
    if (key === "resolved") return violation.resolved_at;
    const entry = violation.status_history?.find((h: any) => h.status === key);
    return entry?.changed_at ?? null;
  };

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = STATUS_ORDER[step.key] <= currentOrder;
        const isCurrent = step.key === violation.status;
        const date = dateFor(step.key);
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            {/* dot + line */}
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full border-2 shrink-0 mt-0.5 transition-colors ${
                done ? "border-[var(--primary)] bg-[var(--primary)]"
                : "border-muted-foreground bg-background"
              } ${isCurrent ? "ring-2 ring-[var(--primary)]/30" : ""}`} />
              {!isLast && <div className={`w-0.5 flex-1 min-h-[24px] ${done ? "bg-[var(--primary)]" : "bg-muted"}`} />}
            </div>
            {/* label */}
            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p className={`text-sm font-medium leading-tight ${isCurrent ? "text-[var(--primary)]" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
                {isCurrent && <span className="ml-2 text-xs font-normal text-[var(--primary)]">← current</span>}
              </p>
              {date && <p className="text-xs text-muted-foreground mt-0.5">{fmtTime(date)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Demo violation fallback ────────────────────────────────────────────────
const DEMO_VIOLATIONS_MAP: Record<string, any> = {
  v1: { id: "v1", mine_id: "m1", inspection_id: null, category: "safety", severity: "critical", status: "open", description: "Methane concentration exceeds 1.25% TLV at Face 14-C, North Shaft. Immediate evacuation completed but source not yet sealed.", due_date: "2026-09-07", regulation_ref: "CMR 2017, Rule 162", resolved_at: null, created_at: "2026-09-05T08:00:00Z", latitude: 23.755, longitude: 86.415, assigned_to: "u3", corrective_actions: [{ id: "ca1", description: "Evacuate workers from Face 14-C", created_at: "2026-09-05T08:30:00Z", created_by: "u3" }], comments: [{ id: "cm1", content: "Auxiliary ventilation booster fan dispatched to site.", created_at: "2026-09-05T09:15:00Z", user_id: "u3" }] },
  v2: { id: "v2", mine_id: "m2", inspection_id: "i2", category: "environment", severity: "high", status: "acknowledged", description: "Effluent discharge from washery pond breached permissible limit for suspended solids (480 mg/L vs 100 mg/L limit).", due_date: "2026-09-12", regulation_ref: "MOEF Notification 2016", resolved_at: null, created_at: "2026-09-04T14:00:00Z", latitude: 23.613, longitude: 87.121, assigned_to: "u4", corrective_actions: [{ id: "ca2", description: "Cease discharge into drainage canal", created_at: "2026-09-04T15:00:00Z", created_by: "u4" }], comments: [] },
  v3: { id: "v3", mine_id: "m1", inspection_id: "i1", category: "safety", severity: "high", status: "open", description: "Personal Protective Equipment non-compliance observed in 18 workers at the open-cast bench area. Helmets absent.", due_date: "2026-09-10", regulation_ref: "CMR 2017, Rule 43", resolved_at: null, created_at: "2026-09-03T09:00:00Z", latitude: 23.755, longitude: 86.415, assigned_to: "u3", corrective_actions: [], comments: [] },
  v4: { id: "v4", mine_id: "m3", inspection_id: "i3", category: "labour", severity: "medium", status: "resolved", description: "Overtime hours exceeded statutory limit (12 hrs/shift) for 7 contract labourers during peak blasting week.", due_date: "2026-08-31", regulation_ref: "Mines Act 1952, Sec 28", resolved_at: "2026-09-02T10:00:00Z", created_at: "2026-08-28T10:00:00Z", latitude: 23.783, longitude: 85.977, assigned_to: "u3", corrective_actions: [{ id: "ca3", description: "Compensatory rest allocated and shift rostering overhauled", created_at: "2026-09-01T10:00:00Z", created_by: "u3" }], comments: [] },
  v5: { id: "v5", mine_id: "m4", inspection_id: null, category: "safety", severity: "critical", status: "open", description: "Emergency escape route obstructed at Level-3 of underground section due to equipment storage. Fire evacuation drill failed.", due_date: "2026-09-06", regulation_ref: "CMR 2017, Rule 107", resolved_at: null, created_at: "2026-09-05T07:00:00Z", latitude: 23.822, longitude: 86.448, assigned_to: "u7", corrective_actions: [], comments: [] },
  v6: { id: "v6", mine_id: "m5", inspection_id: null, category: "environment", severity: "medium", status: "acknowledged", description: "Dust emission from haul road exceeded 150 µg/m³ PM10 limit on three consecutive monitoring days.", due_date: "2026-09-15", regulation_ref: "MOEF EP Act 1986", resolved_at: null, created_at: "2026-09-04T11:00:00Z", latitude: 23.638, longitude: 85.508, assigned_to: "u4", corrective_actions: [], comments: [] },
  v7: { id: "v7", mine_id: "m2", inspection_id: null, category: "production", severity: "low", status: "resolved", description: "Daily production log not submitted for 3 consecutive shifts — 02 Sept to 04 Sept 2026.", due_date: "2026-09-05", regulation_ref: "Coal Mines Regulation, Rule 90", resolved_at: "2026-09-05T09:00:00Z", created_at: "2026-09-04T17:00:00Z", latitude: 23.613, longitude: 87.121, assigned_to: "u3", corrective_actions: [], comments: [] },
  v8: { id: "v8", mine_id: "m6", inspection_id: "i7", category: "safety", severity: "high", status: "open", description: "Winding engine operator found sleeping during shift at Main Shaft — critical safety role unattended for ~40 minutes.", due_date: "2026-09-09", regulation_ref: "CMR 2017, Rule 73", resolved_at: null, created_at: "2026-09-04T23:00:00Z", latitude: 24.189, longitude: 86.304, assigned_to: "u7", corrective_actions: [], comments: [] },
  v9: { id: "v9", mine_id: "m1", inspection_id: "i6", category: "environment", severity: "low", status: "closed", description: "Tree plantation quota (50 trees) for Q2 FY 2025-26 not completed. Only 32 trees planted against statutory requirement.", due_date: "2026-07-31", regulation_ref: "Forest Conservation Act 1980", resolved_at: "2026-09-01T10:00:00Z", created_at: "2026-08-01T09:00:00Z", latitude: 23.755, longitude: 86.415, assigned_to: "u4", corrective_actions: [], comments: [] },
  v10: { id: "v10", mine_id: "m3", inspection_id: null, category: "safety", severity: "medium", status: "open", description: "First-aid kits at 4 surface workstations found expired / incomplete. Bandages, antiseptic, and tourniquet missing.", due_date: "2026-09-13", regulation_ref: "CMR 2017, Rule 44(1)", resolved_at: null, created_at: "2026-09-05T10:00:00Z", latitude: 23.783, longitude: 85.977, assigned_to: "u3", corrective_actions: [], comments: [] },
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ViolationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [newAction, setNewAction] = useState("");
  const [newComment, setNewComment] = useState("");
  const [assignee, setAssignee] = useState<string>("");

  const { data: rawViolation, isLoading } = useQuery({
    queryKey: ["violation", id],
    queryFn: () => violationApi.get(`/v1/violations/${id}`).then(r => r.data),
    enabled: !!id,
    retry: false,
  });

  const { data: rawMines = [] } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then(r => r.data as { id: string; name: string }[]),
    retry: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => authApi.get("/v1/users/").then(r => (r.data.items ?? r.data) as { id: string; full_name: string; role: string }[]),
    retry: false,
  });

  const violation = rawViolation ?? (id ? DEMO_VIOLATIONS_MAP[id] : null);
  const apiMineMap = Object.fromEntries(rawMines.map(m => [m.id, m.name]));
  const mineMap = Object.keys(apiMineMap).length > 0 ? apiMineMap : DEMO_MINE_MAP;

  const addAction = useMutation({
    mutationFn: (description: string) => violationApi.post(`/v1/violations/${id}/actions`, { description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["violation", id] }); setNewAction(""); },
  });

  const addComment = useMutation({
    mutationFn: (content: string) => violationApi.post(`/v1/violations/${id}/comments`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["violation", id] }); setNewComment(""); },
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => violationApi.patch(`/v1/violations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["violation", id] }),
  });

  const assign = useMutation({
    mutationFn: (assignedTo: string) => violationApi.patch(`/v1/violations/${id}`, { assigned_to: assignedTo }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["violation", id] }); },
  });

  const isOverdue = violation
    && violation.due_date
    && new Date(violation.due_date) < new Date()
    && !["resolved", "closed"].includes(violation.status);

  const nextTransitions = NEXT_STATUS[violation?.status ?? "closed"] ?? [];
  const location = violation?.location;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Violation Detail"
        description={violation ? `${violation.category} — ${mineMap[violation.mine_id] ?? "Unknown mine"}` : "Loading…"}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />

      {isLoading ? (
        <ViolationDetailSkeleton />
      ) : !violation ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Violation not found.</CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Left column ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Escalation banner */}
            {isOverdue && (
              <div className="flex items-center gap-3 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">Escalated — overdue</span>
                  <span className="ml-2 font-normal">Due {fmt(violation.due_date)}, still {violation.status}</span>
                </div>
                <Badge variant="warning" className="ml-auto shrink-0">OVERDUE</Badge>
              </div>
            )}

            {/* Main detail card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={severityVariant[violation.severity] ?? "outline"}>{violation.severity.toUpperCase()}</Badge>
                  <Badge variant={statusVariant[violation.status] ?? "outline"}>{violation.status.replace("_", " ")}</Badge>
                  <span className="text-sm text-muted-foreground capitalize ml-1">{violation.category}</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="font-medium">Mine:</span> {mineMap[violation.mine_id] ?? "—"}</div>
                  <div><span className="font-medium">Reported:</span> {fmt(violation.created_at)}</div>
                  <div><span className="font-medium">Due Date:</span> <span className={isOverdue ? "text-orange-700 font-semibold" : ""}>{fmt(violation.due_date)}</span></div>
                  {violation.resolved_at && <div><span className="font-medium">Resolved:</span> {fmt(violation.resolved_at)}</div>}
                  {violation.regulation_ref && <div><span className="font-medium">Regulation:</span> {violation.regulation_ref}</div>}
                  {violation.assigned_to && (
                    <div><span className="font-medium">Assigned to:</span> {users.find(u => u.id === violation.assigned_to)?.full_name ?? violation.assigned_to}</div>
                  )}
                </div>

                <div className="rounded-md border border-[var(--border)] p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{violation.description}</p>
                </div>

                {/* Status transitions */}
                {nextTransitions.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {nextTransitions.map(t => (
                      <Button
                        key={t.value} size="sm" variant="outline"
                        onClick={() => updateStatus.mutate(t.value)}
                        disabled={updateStatus.isPending}
                      >
                        {updateStatus.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                        {t.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign / reassign */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4" />Assign Inspector</CardTitle></CardHeader>
              <CardContent className="pt-0 pb-4 px-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={assignee || violation.assigned_to || ""}
                      onChange={e => setAssignee(e.target.value)}
                      className="w-full appearance-none rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">Select inspector…</option>
                      {users
                        .filter(u => ["inspector", "safety_officer", "INSPECTOR", "SAFETY_OFFICER"].includes(u.role))
                        .map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role.toLowerCase()})</option>)
                      }
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    size="sm"
                    disabled={!assignee || assign.isPending}
                    onClick={() => assign.mutate(assignee)}
                  >
                    {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Corrective actions */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Corrective Actions</CardTitle></CardHeader>
              <CardContent className="pt-0 pb-4 px-6 space-y-3">
                {violation.corrective_actions?.length ? (
                  <ul className="space-y-2">
                    {violation.corrective_actions.map((a: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                        <div>
                          <p>{a.description ?? a}</p>
                          {a.due_date && <p className="text-xs text-muted-foreground mt-0.5">Due {fmt(a.due_date)}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No corrective actions yet.</p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe corrective action…"
                    value={newAction}
                    onChange={e => setNewAction(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && newAction.trim() && addAction.mutate(newAction.trim())}
                  />
                  <Button size="sm" onClick={() => newAction.trim() && addAction.mutate(newAction.trim())} disabled={addAction.isPending || !newAction.trim()}>
                    {addAction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Comments</CardTitle></CardHeader>
              <CardContent className="pt-0 pb-4 px-6 space-y-3">
                {violation.comments?.length ? (
                  <ul className="space-y-2">
                    {violation.comments.map((c: any, i: number) => {
                      const authorName = c.author_name ?? users.find((u: any) => u.id === c.author_id)?.full_name ?? "Inspector";
                      return (
                        <li key={i} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs">{authorName}</span>
                            <span className="text-xs text-muted-foreground">{fmtTime(c.created_at)}</span>
                          </div>
                          <p>{c.content ?? c}</p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment…"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && newComment.trim() && addComment.mutate(newComment.trim())}
                  />
                  <Button size="sm" onClick={() => newComment.trim() && addComment.mutate(newComment.trim())} disabled={addComment.isPending || !newComment.trim()}>
                    {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Timeline */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Status Timeline</CardTitle></CardHeader>
              <CardContent className="pt-0 pb-4 px-6">
                <Timeline violation={violation} />
              </CardContent>
            </Card>

            {/* Mini-map */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Location</CardTitle></CardHeader>
              <CardContent className="pt-0 pb-4 px-6">
                {location?.lat && location?.lng ? (
                  <MiniMap lat={location.lat} lng={location.lng} />
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No location recorded</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
