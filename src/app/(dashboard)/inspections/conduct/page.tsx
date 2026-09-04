"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, Camera, MapPin, X, Loader2, PenLine, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inspectionApi, authApi } from "@/lib/services";

const STEPS = ["Mine & Template", "Checklist", "Sign & Submit"] as const;
const DRAFT_KEY = "inspection_draft_v2";

type ItemStatus = "pass" | "fail" | "na";
type ChecklistItem = { description: string; status: ItemStatus; notes: string; photos: string[] };

const DEFAULT_ITEMS: string[] = [
  "Safety equipment inspection",
  "Emergency exits verified",
  "Fire suppression systems checked",
  "Electrical installations inspected",
  "Ventilation systems operational",
  "Ground stability assessment",
  "Chemical storage compliance",
  "Worker PPE compliance",
];

function cls(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Signature pad ─────────────────────────────────────────────────────────────
function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: MouseEvent | TouchEvent, rect: DOMRect) => {
    const src = "touches" in e ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e.nativeEvent as any, rect);
    ctx.beginPath(); ctx.moveTo(x, y);
    e.preventDefault();
  }, []);

  const move = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1e3a5f";
    const { x, y } = getPos(e.nativeEvent as any, rect);
    ctx.lineTo(x, y); ctx.stroke();
    e.preventDefault();
  }, []);

  const end = useCallback(() => {
    drawing.current = false;
    const canvas = canvasRef.current; if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  }, [onChange]);

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Inspector Signature</label>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={140}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        className="w-full rounded-md border border-dashed border-[var(--border)] bg-white cursor-crosshair touch-none"
        style={{ maxWidth: "100%", height: 140 }}
      />
      <p className="text-xs text-muted-foreground flex items-center gap-1"><PenLine className="h-3 w-3" /> Draw your signature above</p>
    </div>
  );
}

// ── Photo capture ─────────────────────────────────────────────────────────────
function PhotoCapture({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) onChange([...photos, ev.target.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded border border-dashed border-[var(--border)] text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>
      {/* accept="image/*" capture="environment" triggers camera on mobile, file picker on desktop */}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFile} />
    </div>
  );
}

// ── GPS hook ──────────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = () => {
    if (!navigator.geolocation) { setGpsError("Geolocation not supported"); return; }
    setLoading(true); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setLoading(false); },
      err => { setGpsError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { coords, gpsError, loading, capture };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ConductInspectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Step 1
  const [mineId, setMineId] = useState("");
  const [inspectionType, setInspectionType] = useState("routine");
  const [scheduledAt, setScheduledAt] = useState(() => new Date().toISOString().slice(0, 16));

  // Step 2
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_ITEMS.map(d => ({ description: d, status: "na", notes: "", photos: [] }))
  );

  const { coords, gpsError, loading: gpsLoading, capture: captureGPS } = useGPS();

  const { data: mines = [], isLoading: minesLoading } = useQuery({
    queryKey: ["mines"],
    queryFn: () => authApi.get("/v1/mines/").then(r => r.data as { id: string; name: string }[]),
  });

  // ── Draft persistence ──────────────────────────────────────────────────────
  const getDraft = useCallback(() => ({
    mineId, inspectionType, scheduledAt, checklist,
    coords: coords ?? undefined,
  }), [mineId, inspectionType, scheduledAt, checklist, coords]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getDraft()));
      setLastSaved(new Date());
    } catch { /* quota exceeded — skip silently */ }
  }, [getDraft]);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.mineId) setMineId(d.mineId);
      if (d.inspectionType) setInspectionType(d.inspectionType);
      if (d.scheduledAt) setScheduledAt(d.scheduledAt);
      if (d.checklist) setChecklist(d.checklist);
    } catch { /* corrupt draft — ignore */ }
  }, []);

  // Auto-save every 30 s
  useEffect(() => {
    const id = setInterval(saveDraft, 30_000);
    return () => clearInterval(id);
  }, [saveDraft]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const mineName = mines.find(m => m.id === mineId)?.name ?? "—";
  const setItem = (i: number, field: keyof ChecklistItem, value: string | string[]) =>
    setChecklist(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const submit = useMutation({
    mutationFn: () =>
      inspectionApi.post("/v1/inspections/", {
        mine_id: mineId,
        inspection_type: inspectionType,
        scheduled_at: new Date(scheduledAt).toISOString(),
        checklist_items: checklist.map(({ photos: _, ...rest }) => rest), // photos uploaded separately
        location: coords ?? null,
        signature: signature ?? null,
      }),
    onSuccess: () => { clearDraft(); router.push("/inspections"); },
  });

  const canAdvance1 = !!mineId && !!scheduledAt;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Conduct Inspection" description="Complete a new mine safety inspection" />
        <div className="flex items-center gap-3">
          {lastSaved && (
            <p className="text-xs text-muted-foreground">Saved {lastSaved.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          )}
          <Button variant="outline" size="sm" onClick={() => { saveDraft(); }}>Save Draft</Button>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={cls(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                i < step ? "bg-green-600 text-white" : i === step ? "bg-[var(--primary)] text-white" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p className="mt-1 text-xs text-muted-foreground whitespace-nowrap">{label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cls("h-0.5 flex-1 mx-2 transition-colors", i < step ? "bg-green-600" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">

          {/* ── Step 1: Mine & Template ──────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5 max-w-md">
              <h3 className="text-base font-semibold">Select Mine &amp; Template</h3>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Mine</label>
                <select
                  value={mineId} onChange={e => setMineId(e.target.value)} disabled={minesLoading}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">Select a mine…</option>
                  {mines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Inspection Type</label>
                <select
                  value={inspectionType} onChange={e => setInspectionType(e.target.value)}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="routine">Routine</option>
                  <option value="safety">Safety</option>
                  <option value="environmental">Environmental</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Date &amp; Time</label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>

              {/* GPS capture */}
              <div>
                <label className="mb-1.5 block text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Location (GPS)
                </label>
                {coords ? (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 space-y-0.5">
                    <p>Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}</p>
                    <p className="text-green-600">Accuracy: ±{Math.round(coords.accuracy)} m</p>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={captureGPS} disabled={gpsLoading}>
                    {gpsLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Getting location…</> : <><MapPin className="h-3.5 w-3.5 mr-1" />Capture GPS Location</>}
                  </Button>
                )}
                {gpsError && <p className="mt-1 text-xs text-[var(--danger)]">{gpsError}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(1)} disabled={!canAdvance1}>Next →</Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Checklist ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Checklist — {mineName}</h3>
                <div className="text-xs text-muted-foreground space-x-3">
                  <span className="text-green-700">{checklist.filter(c => c.status === "pass").length} Pass</span>
                  <span className="text-red-700">{checklist.filter(c => c.status === "fail").length} Fail</span>
                  <span>{checklist.filter(c => c.status === "na").length} N/A</span>
                </div>
              </div>

              <div className="space-y-3">
                {checklist.map((item, i) => (
                  <div key={i} className={cls(
                    "rounded-md border p-3 space-y-3 transition-colors",
                    item.status === "pass" ? "border-green-200 bg-green-50/40"
                      : item.status === "fail" ? "border-red-200 bg-red-50/40"
                      : "border-[var(--border)]"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug">{item.description}</p>
                      <div className="flex shrink-0 gap-1">
                        {(["pass", "fail", "na"] as const).map(s => (
                          <button key={s} type="button" onClick={() => setItem(i, "status", s)}
                            className={cls(
                              "rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                              item.status === s
                                ? s === "pass" ? "bg-green-600 text-white"
                                  : s === "fail" ? "bg-red-600 text-white"
                                  : "bg-muted-foreground text-white"
                                : "border border-[var(--border)] text-muted-foreground hover:bg-muted"
                            )}
                          >{s.toUpperCase()}</button>
                        ))}
                      </div>
                    </div>

                    <Input
                      placeholder="Notes (optional)…"
                      value={item.notes}
                      onChange={e => setItem(i, "notes", e.target.value)}
                      className="text-xs h-8"
                    />

                    {/* Per-item photo capture */}
                    <PhotoCapture
                      photos={item.photos}
                      onChange={photos => setItem(i, "photos", photos)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={() => setStep(2)}>Review →</Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Sign & Submit ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 max-w-xl">
              <h3 className="text-base font-semibold">Review &amp; Submit</h3>

              {/* Summary */}
              <div className="rounded-md border border-[var(--border)] p-4 space-y-2 text-sm">
                <div className="flex gap-2"><span className="font-medium w-36">Mine:</span><span>{mineName}</span></div>
                <div className="flex gap-2"><span className="font-medium w-36">Type:</span><span className="capitalize">{inspectionType}</span></div>
                <div className="flex gap-2"><span className="font-medium w-36">Scheduled:</span><span>{new Date(scheduledAt).toLocaleString("en-IN")}</span></div>
                {coords && (
                  <div className="flex gap-2"><span className="font-medium w-36">Location:</span><span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span></div>
                )}
              </div>

              <div className="flex gap-6 text-sm font-medium">
                <span className="text-green-700">{checklist.filter(c => c.status === "pass").length} Pass</span>
                <span className="text-red-700">{checklist.filter(c => c.status === "fail").length} Fail</span>
                <span className="text-muted-foreground">{checklist.filter(c => c.status === "na").length} N/A</span>
                <span className="text-muted-foreground">{checklist.flatMap(c => c.photos).length} Photos</span>
              </div>

              {/* Failed items callout */}
              {checklist.some(c => c.status === "fail") && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-red-800">Failed items:</p>
                  {checklist.filter(c => c.status === "fail").map((c, i) => (
                    <p key={i} className="text-xs text-red-700">• {c.description}</p>
                  ))}
                </div>
              )}

              {/* Signature pad */}
              <SignaturePad onChange={setSignature} />

              {submit.isError && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
                  Submission failed — please try again.
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button
                  onClick={() => submit.mutate()}
                  disabled={submit.isPending || !signature}
                  title={!signature ? "Draw your signature above to submit" : undefined}
                >
                  {submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Submitting…</> : "Submit Inspection"}
                </Button>
              </div>
              {!signature && <p className="text-xs text-muted-foreground text-center">Signature required before submitting</p>}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
