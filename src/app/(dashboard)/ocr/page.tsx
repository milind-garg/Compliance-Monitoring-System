"use client";
import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, ScanText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ocrApi } from "@/lib/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageResult {
  page_number: number;
  text: string;
  confidence: number;
  word_count: number;
}

interface DetectedEntities {
  license_numbers: string[];
  dates: string[];
  amounts: string[];
  percentages: string[];
  reference_numbers: string[];
}

interface OCRResponse {
  text: string;
  pages: PageResult[];
  total_pages: number;
  overall_confidence: number;
  detected_entities: DetectedEntities;
  document_type: string | null;
  processing_time_ms: number;
  file_name: string | null;
  file_size: number;
  mime_type: string;
  truncated: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  inspection_report:      "Inspection Report",
  compliance_certificate: "Compliance Certificate",
  violation_notice:       "Violation Notice",
  license_document:       "License Document",
  incident_report:        "Incident Report",
  environmental_report:   "Environmental Report",
  safety_report:          "Safety Report",
};

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.tiff,.tif,.bmp,.webp,.gif";

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function confColor(c: number) {
  if (c >= 0.8) return "text-green-600 dark:text-green-400";
  if (c >= 0.5) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500";
}

function EntitySection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((v) => (
          <Badge key={v} variant="outline" className="font-mono text-xs">{v}</Badge>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OcrPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<"eng" | "hin" | "eng+hin">("eng");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [activePage, setActivePage] = useState(0); // 0 = full text
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setActivePage(0);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setActivePage(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", language);
      const res = await ocrApi.post<OCRResponse>("/v1/ocr/extract", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      });
      setResult(res.data);
      setActivePage(0);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "OCR failed. Check that the OCR service is running.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const displayText =
    activePage === 0
      ? result?.text ?? ""
      : result?.pages.find((p) => p.page_number === activePage)?.text ?? "";

  const activeConf =
    activePage === 0
      ? result?.overall_confidence ?? 0
      : (result?.pages.find((p) => p.page_number === activePage)?.confidence ?? 0);

  return (
    <div>
      <PageHeader title="OCR Document Parser" description="Extract text from uploaded mine-governance documents" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left column: upload + controls ─────────────────────────────── */}
        <div className="space-y-4">
          {/* Drop zone */}
          <Card>
            <CardContent className="p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !file && inputRef.current?.click()}
                className={[
                  "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors",
                  file ? "py-6 cursor-default" : "py-12 cursor-pointer",
                  dragging
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--stone)]/40",
                ].join(" ")}
              >
                <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onInputChange} />

                {file ? (
                  <div className="flex items-center gap-3 w-full px-4">
                    <FileText className="h-8 w-8 text-[var(--primary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-[var(--foreground)]">{file.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{fmtBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="p-1.5 rounded-md hover:bg-[var(--stone)] transition-colors"
                    >
                      <X className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-[var(--primary)]" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-[var(--foreground)]">Drop a file or click to browse</p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">PDF, JPEG, PNG, TIFF, BMP, WebP — up to 20 MB</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Language selector */}
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <p className="text-sm font-medium text-[var(--foreground)] shrink-0">Language</p>
              <div className="flex gap-2">
                {(["eng", "hin", "eng+hin"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={[
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      language === l
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50",
                    ].join(" ")}
                  >
                    {l === "eng" ? "English" : l === "hin" ? "Hindi" : "English + Hindi"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Extract button */}
          <button
            onClick={submit}
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
            {loading ? "Processing…" : "Extract Text"}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Summary card (after result) */}
          {result && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-[var(--foreground)]">Extraction complete</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <span className="text-[var(--muted-foreground)]">Pages</span>
                  <span className="font-medium">
                    {result.total_pages}{result.truncated && <span className="text-xs text-yellow-600 ml-1">(truncated)</span>}
                  </span>
                  <span className="text-[var(--muted-foreground)]">Confidence</span>
                  <span className={`font-mono font-medium ${confColor(result.overall_confidence)}`}>
                    {(result.overall_confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[var(--muted-foreground)]">Document type</span>
                  <span className="font-medium">
                    {result.document_type ? DOC_TYPE_LABELS[result.document_type] ?? result.document_type : "Unknown"}
                  </span>
                  <span className="text-[var(--muted-foreground)]">Processing time</span>
                  <span className="font-mono">{result.processing_time_ms} ms</span>
                  <span className="text-[var(--muted-foreground)]">File size</span>
                  <span className="font-mono">{fmtBytes(result.file_size)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detected entities */}
          {result && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="font-semibold text-[var(--foreground)]">Detected Entities</p>
                <EntitySection label="License / Permit Numbers" items={result.detected_entities.license_numbers} />
                <EntitySection label="Dates" items={result.detected_entities.dates} />
                <EntitySection label="Amounts" items={result.detected_entities.amounts} />
                <EntitySection label="Percentages" items={result.detected_entities.percentages} />
                <EntitySection label="Reference Numbers" items={result.detected_entities.reference_numbers} />
                {Object.values(result.detected_entities).every((a) => !a.length) && (
                  <p className="text-sm text-[var(--muted-foreground)]">No domain entities detected.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column: extracted text ────────────────────────────────── */}
        <div>
          {result ? (
            <Card className="h-full flex flex-col">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 flex-wrap">
                <button
                  onClick={() => setActivePage(0)}
                  className={[
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    activePage === 0
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--stone)]",
                  ].join(" ")}
                >
                  Full text
                </button>
                {result.pages.map((p) => (
                  <button
                    key={p.page_number}
                    onClick={() => setActivePage(p.page_number)}
                    className={[
                      "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                      activePage === p.page_number
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--stone)]",
                    ].join(" ")}
                  >
                    P{p.page_number}
                    <span className={`ml-1 ${confColor(p.confidence)}`}>
                      {(p.confidence * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
                <span className={`ml-auto text-xs font-mono ${confColor(activeConf)}`}>
                  {(activeConf * 100).toFixed(1)}% confidence
                </span>
              </div>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <textarea
                  readOnly
                  value={displayText}
                  className="w-full h-full min-h-[520px] resize-none bg-transparent font-mono text-xs leading-relaxed text-[var(--foreground)] p-4 outline-none"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3 text-center p-8">
                <div className="h-16 w-16 rounded-full bg-[var(--stone)] flex items-center justify-center">
                  <ScanText className="h-8 w-8 text-[var(--muted-foreground)]" />
                </div>
                <p className="font-medium text-[var(--foreground)]">No document loaded</p>
                <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                  Upload a PDF or image on the left to extract text, entities, and document type.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
