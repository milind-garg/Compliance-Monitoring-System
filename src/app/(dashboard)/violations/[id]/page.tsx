"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { violationApi, authApi } from "@/lib/services";

const statusVariant: Record<string, "danger" | "warning" | "success" | "outline"> = {
  open: "danger", acknowledged: "warning", resolved: "success", closed: "outline",
};
const severityVariant: Record<string, "danger" | "warning" | "outline"> = {
  critical: "danger", high: "warning", medium: "outline", low: "outline",
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

export default function ViolationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [newAction, setNewAction] = useState("");
  const [newComment, setNewComment] = useState("");

  const { data: violation, isLoading } = useQuery({
    queryKey: ["violation", id],
    queryFn: () => violationApi.get(`/v1/violations/${id}`).then((r) => r.data),
  });
  const { data: mines = [] } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]),
  });
  const mineMap = Object.fromEntries(mines.map((m) => [m.id, m.name]));

  const addAction = useMutation({
    mutationFn: (description: string) =>
      violationApi.post(`/v1/violations/${id}/actions`, { description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["violation", id] }); setNewAction(""); },
  });

  const addComment = useMutation({
    mutationFn: (content: string) =>
      violationApi.post(`/v1/violations/${id}/comments`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["violation", id] }); setNewComment(""); },
  });

  return (
    <div>
      <PageHeader
        title="Violation Detail"
        description="Track and resolve this violation"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton /></CardContent></Card>
      ) : !violation ? (
        <Card><CardContent className="p-6 text-center text-[var(--muted-foreground)]">Violation not found.</CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Main card */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={severityVariant[violation.severity] ?? "outline"}>{violation.severity.toUpperCase()}</Badge>
                    <Badge variant={statusVariant[violation.status] ?? "outline"}>{violation.status.replace("_", " ")}</Badge>
                  </div>
                </div>
                <p className="text-sm mb-2"><span className="font-medium">Category:</span> <span className="capitalize">{violation.category}</span></p>
                <p className="text-sm mb-2"><span className="font-medium">Mine:</span> {mineMap[violation.mine_id] ?? "Unknown"}</p>
                {violation.regulation_ref && (
                  <p className="text-sm mb-2"><span className="font-medium">Regulation Ref:</span> {violation.regulation_ref}</p>
                )}
                <p className="text-sm mb-2"><span className="font-medium">Reported:</span> {fmt(violation.created_at)}</p>
                <p className="text-sm mb-2"><span className="font-medium">Due Date:</span> {fmt(violation.due_date)}</p>
                {violation.resolved_at && (
                  <p className="text-sm mb-2"><span className="font-medium">Resolved:</span> {fmt(violation.resolved_at)}</p>
                )}
                <div className="mt-4 rounded-md border border-[var(--border)] p-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Description</p>
                  <p className="text-sm">{violation.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Corrective actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-sm font-semibold">Corrective Actions</h3>
                {violation.corrective_actions?.length ? (
                  <ul className="mb-4 space-y-2">
                    {violation.corrective_actions.map((a: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                        <span>{a.description ?? a}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-4 text-sm text-[var(--muted-foreground)]">No corrective actions yet.</p>
                )}
                <div className="flex gap-2">
                  <Input placeholder="Describe corrective action…" value={newAction} onChange={(e) => setNewAction(e.target.value)} />
                  <Button size="sm" onClick={() => newAction.trim() && addAction.mutate(newAction.trim())} disabled={addAction.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-sm font-semibold">Comments</h3>
                {violation.comments?.length ? (
                  <ul className="mb-4 space-y-3">
                    {violation.comments.map((c: any, i: number) => (
                      <li key={i} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                        <p className="font-medium text-xs text-[var(--muted-foreground)] mb-1">{fmt(c.created_at ?? null)}</p>
                        <p>{c.content ?? c}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-4 text-sm text-[var(--muted-foreground)]">No comments yet.</p>
                )}
                <div className="flex gap-2">
                  <Input placeholder="Add a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  <Button size="sm" onClick={() => newComment.trim() && addComment.mutate(newComment.trim())} disabled={addComment.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 text-sm font-semibold">Status Timeline</h3>
                <div className="space-y-3">
                  {[
                    { label: "Reported", done: true, date: fmt(violation.created_at) },
                    { label: "Acknowledged", done: ["acknowledged", "resolved", "closed"].includes(violation.status), date: null },
                    { label: "Resolved", done: ["resolved", "closed"].includes(violation.status), date: violation.resolved_at ? fmt(violation.resolved_at) : null },
                    { label: "Closed", done: violation.status === "closed", date: null },
                  ].map((step) => (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${step.done ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />
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
