"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inspectionApi, authApi } from "@/lib/services";

const STEPS = ["Select Mine & Template", "Checklist", "Review & Submit"] as const;

const DEFAULT_CHECKLIST = [
  "Safety equipment inspection",
  "Emergency exits verified",
  "Fire suppression systems checked",
  "Electrical installations inspected",
  "Ventilation systems operational",
  "Ground stability assessment",
  "Chemical storage compliance",
  "Worker safety PPE compliance",
];

type ChecklistItem = { description: string; status: "pass" | "fail" | "na"; notes: string };

export default function ConductInspectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 fields
  const [mineId, setMineId] = useState("");
  const [inspectionType, setInspectionType] = useState("routine");
  const [scheduledAt, setScheduledAt] = useState(() => new Date().toISOString().slice(0, 16));

  // Step 2 fields
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((d) => ({ description: d, status: "na", notes: "" }))
  );

  const { data: mines = [], isLoading: minesLoading } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as { id: string; name: string }[]),
  });

  const mineName = mines.find((m) => m.id === mineId)?.name ?? "—";

  const submit = useMutation({
    mutationFn: () =>
      inspectionApi.post("/v1/inspections/", {
        mine_id: mineId,
        inspection_type: inspectionType,
        scheduled_at: new Date(scheduledAt).toISOString(),
        checklist_items: checklist,
      }),
    onSuccess: () => router.push("/inspections"),
  });

  const saveDraft = () => {
    // ponytail: localStorage draft; replace with API when backend supports it
    localStorage.setItem("inspection_draft", JSON.stringify({ mineId, inspectionType, scheduledAt, checklist }));
    alert("Draft saved locally.");
  };

  const setItem = (i: number, field: keyof ChecklistItem, value: string) =>
    setChecklist((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const canAdvance1 = !!mineId && !!scheduledAt;

  return (
    <div>
      <PageHeader title="Conduct Inspection" description="Complete a new mine inspection" />

      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${i <= step ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] whitespace-nowrap">{label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${i < step ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1 */}
          {step === 0 && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-base font-semibold">Select Mine &amp; Template</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mine</label>
                <select
                  value={mineId}
                  onChange={(e) => setMineId(e.target.value)}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  disabled={minesLoading}
                >
                  <option value="">Select a mine…</option>
                  {mines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Inspection Type</label>
                <select
                  value={inspectionType}
                  onChange={(e) => setInspectionType(e.target.value)}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="routine">Routine</option>
                  <option value="safety">Safety</option>
                  <option value="environmental">Environmental</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Date &amp; Time</label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setStep(1)} disabled={!canAdvance1}>Next</Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Checklist — {mineName}</h3>
              <div className="space-y-3">
                {checklist.map((item, i) => (
                  <div key={i} className="rounded-md border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium">{item.description}</p>
                      <div className="flex shrink-0 gap-1">
                        {(["pass", "fail", "na"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setItem(i, "status", s)}
                            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${item.status === s
                              ? s === "pass" ? "bg-green-100 text-green-800"
                                : s === "fail" ? "bg-red-100 text-red-800"
                                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                              : "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                              }`}
                          >
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      placeholder="Notes (optional)…"
                      value={item.notes}
                      onChange={(e) => setItem(i, "notes", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
                  <Button onClick={() => setStep(2)}>Review</Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Review &amp; Submit</h3>
              <div className="rounded-md border border-[var(--border)] p-4 space-y-2 text-sm">
                <div className="flex gap-2"><span className="font-medium w-32">Mine:</span><span>{mineName}</span></div>
                <div className="flex gap-2"><span className="font-medium w-32">Type:</span><span className="capitalize">{inspectionType}</span></div>
                <div className="flex gap-2"><span className="font-medium w-32">Scheduled:</span><span>{new Date(scheduledAt).toLocaleString("en-IN")}</span></div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Summary</h4>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-700">{checklist.filter((c) => c.status === "pass").length} Pass</span>
                  <span className="text-red-700">{checklist.filter((c) => c.status === "fail").length} Fail</span>
                  <span className="text-[var(--muted-foreground)]">{checklist.filter((c) => c.status === "na").length} N/A</span>
                </div>
              </div>
              {submit.isError && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
                  Submission failed. Please try again.
                </div>
              )}
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                  {submit.isPending ? "Submitting…" : "Submit Inspection"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
