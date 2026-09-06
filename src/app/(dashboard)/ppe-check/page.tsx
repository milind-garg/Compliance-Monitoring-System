"use client";
import { useCallback, useRef, useState } from "react";
import {
  Upload, ShieldCheck, ShieldAlert, ShieldX,
  HardHat, Shirt, Glasses, AlertTriangle,
  Loader2, X, CheckCircle, XCircle, HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiApi } from "@/lib/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItemResult {
  detected: boolean | null;
  confidence: number;
  note?: string | null;
}

interface PPEResult {
  compliant: boolean;
  missing: string[];
  helmet: ItemResult;
  safety_vest: ItemResult;
  mask: ItemResult;
  gloves: ItemResult;
  analysis_note: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ConfBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right text-[var(--muted-foreground)]">{pct}%</span>
    </div>
  );
}

function ItemCard({
  label,
  icon: Icon,
  result,
}: {
  label: string;
  icon: React.ElementType;
  result: ItemResult;
}) {
  const { detected, confidence, note } = result;
  const isUnknown = detected === null;
  const borderColor = isUnknown
    ? "border-[var(--border)]"
    : detected
    ? "border-green-500/40 bg-green-500/5"
    : "border-red-500/40 bg-red-500/5";

  return (
    <div className={`rounded-xl border p-4 ${borderColor} transition-colors`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${isUnknown ? "bg-[var(--stone)]" : detected ? "bg-green-500/10" : "bg-red-500/10"}`}>
          <Icon className={`h-5 w-5 ${isUnknown ? "text-[var(--muted-foreground)]" : detected ? "text-green-600" : "text-red-500"}`} />
        </div>
        <span className="font-semibold text-sm text-[var(--foreground)]">{label}</span>
        <div className="ml-auto">
          {isUnknown
            ? <HelpCircle className="h-5 w-5 text-[var(--muted-foreground)]" />
            : detected
            ? <CheckCircle className="h-5 w-5 text-green-500" />
            : <XCircle className="h-5 w-5 text-red-500" />}
        </div>
      </div>
      {!isUnknown && <ConfBar value={confidence} />}
      {note && <p className="text-xs text-[var(--muted-foreground)] mt-2">{note}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PPECheckPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PPEResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await aiApi.post<PPEResult>("/v1/ppe/check", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30_000,
      });
      setResult(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Analysis failed.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="PPE Safety Check"
        description="Upload a worker photo to detect personal protective equipment compliance"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Upload ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Worker photo" className="w-full rounded-xl object-contain max-h-80" />
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={[
                    "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-14 cursor-pointer transition-colors",
                    dragging
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50",
                  ].join(" ")}
                >
                  <div className="h-14 w-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-[var(--primary)]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[var(--foreground)]">Drop a worker photo</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Clear front-facing photo works best · JPEG, PNG, WebP
                    </p>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </CardContent>
          </Card>

          <button
            onClick={analyze}
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
              : <><ShieldAlert className="h-4 w-4" /> Analyze PPE Compliance</>}
          </button>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Card>
            <CardContent className="p-5 space-y-2 text-sm text-[var(--muted-foreground)]">
              <p className="font-semibold text-[var(--foreground)]">Tips for best accuracy</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use a well-lit, clear front-facing photo</li>
                <li>Ensure the worker is the main subject</li>
                <li>Yellow or orange hard hats are reliably detected</li>
                <li>Hi-vis orange or lime-green vests are detected</li>
                <li>Full-body shot improves boots/gloves detection</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ── Result ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Verdict banner */}
              <div className={[
                "rounded-xl p-5 flex items-center gap-4 border",
                result.compliant
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30",
              ].join(" ")}>
                {result.compliant
                  ? <ShieldCheck className="h-10 w-10 text-green-500 shrink-0" />
                  : <ShieldX className="h-10 w-10 text-red-500 shrink-0" />}
                <div>
                  <p className={`text-xl font-bold ${result.compliant ? "text-green-600" : "text-red-600"}`}>
                    {result.compliant ? "PPE Compliant" : "Non-Compliant"}
                  </p>
                  {result.missing.length > 0 && (
                    <p className="text-sm text-red-600 mt-0.5">
                      Missing: {result.missing.join(", ")}
                    </p>
                  )}
                </div>
                <Badge variant={result.compliant ? "success" : "danger"} className="ml-auto">
                  {result.compliant ? "PASS" : "FAIL"}
                </Badge>
              </div>

              {/* Per-item cards */}
              <div className="grid grid-cols-2 gap-3">
                <ItemCard label="Hard Hat" icon={HardHat} result={result.helmet} />
                <ItemCard label="Safety Vest" icon={Shirt} result={result.safety_vest} />
                <ItemCard label="Face Mask" icon={Glasses} result={result.mask} />
                <ItemCard label="Gloves" icon={HelpCircle} result={result.gloves} />
              </div>

              <Card>
                <CardContent className="p-4 text-xs text-[var(--muted-foreground)]">
                  <p className="font-semibold text-[var(--foreground)] mb-1">Analysis note</p>
                  {result.analysis_note}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3 text-center p-8">
                <div className="h-16 w-16 rounded-full bg-[var(--stone)] flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-[var(--muted-foreground)]" />
                </div>
                <p className="font-semibold text-[var(--foreground)]">No analysis yet</p>
                <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                  Upload a worker photo on the left to check PPE compliance — helmet, safety vest, mask, and gloves.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
