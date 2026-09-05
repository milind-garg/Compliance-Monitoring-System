"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";
import { gisApi, violationApi, inspectionApi } from "@/lib/services";
import type { MinePinProps, HeatPoint, ViolationMarker, InspectionMarker } from "@/components/shared/MineMap";
import { Skeleton } from "@/components/ui/skeleton";

const MineMap = dynamic(() => import("@/components/shared/MineMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading map…
    </div>
  ),
});

interface GeoFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    mine_id: string;
    name: string;
    mine_type: string;
    compliance_score: number;
    risk: string;
    open_violations: number;
  };
}

interface NearbyMine {
  mine_id: string;
  name: string;
  mine_type: string;
  lat: number;
  lng: number;
  distance_km: number;
}

// ── Demo data (used when GIS service is offline) ──────────────────────────────
const DEMO_MINES: MinePinProps[] = [
  { id: "1", name: "Jharia Coalfield Alpha", lat: 23.755, lng: 86.415, risk: "CRITICAL", score: 38, open_violations: 12 },
  { id: "2", name: "Raniganj Central Block", lat: 23.613, lng: 87.121, risk: "HIGH",     score: 61, open_violations: 7  },
  { id: "3", name: "Bokaro Deep Mine",        lat: 23.783, lng: 85.977, risk: "MEDIUM",   score: 74, open_violations: 3  },
  { id: "4", name: "Dhanbad North Pit",       lat: 23.822, lng: 86.448, risk: "HIGH",     score: 55, open_violations: 9  },
  { id: "5", name: "Ramgarh Underground",     lat: 23.638, lng: 85.508, risk: "LOW",      score: 91, open_violations: 0  },
  { id: "6", name: "Giridih Open-cast",       lat: 24.189, lng: 86.304, risk: "MEDIUM",   score: 78, open_violations: 2  },
  { id: "7", name: "Hazaribagh East Block",   lat: 24.012, lng: 85.352, risk: "LOW",      score: 88, open_violations: 1  },
  { id: "8", name: "Korba Main Complex",      lat: 22.362, lng: 82.719, risk: "CRITICAL", score: 29, open_violations: 18 },
  { id: "9", name: "Talcher Central Mine",    lat: 20.952, lng: 85.225, risk: "MEDIUM",   score: 69, open_violations: 4  },
  { id: "10", name: "Singrauli Alpha Seam",   lat: 24.199, lng: 82.672, risk: "HIGH",     score: 52, open_violations: 8  },
];

const DEMO_HEATMAP: HeatPoint[] = DEMO_MINES.filter((m) => m.open_violations! > 0).map((m) => ({
  lat: m.lat,
  lng: m.lng,
  weight: m.open_violations!,
  mine_id: m.id,
  mine_name: m.name,
}));
// ─────────────────────────────────────────────────────────────────────────────

const riskVariant: Record<string, "danger" | "warning" | "outline" | "success"> = {
  CRITICAL: "danger",
  HIGH:     "warning",
  MEDIUM:   "outline",
  LOW:      "success",
  UNKNOWN:  "outline",
};

const riskColor: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH:     "#f97316",
  MEDIUM:   "#eab308",
  LOW:      "#22c55e",
  UNKNOWN:  "#6b7280",
};

const riskIcon: Record<string, React.ReactNode> = {
  CRITICAL: <AlertTriangle className="h-3 w-3" />,
  HIGH:     <Zap className="h-3 w-3" />,
  MEDIUM:   <Activity className="h-3 w-3" />,
  LOW:      <CheckCircle2 className="h-3 w-3" />,
};

export default function MapsPage() {
  const qc = useQueryClient();
  const [nearbyLat, setNearbyLat] = useState("23.8");
  const [nearbyLng, setNearbyLng] = useState("86.5");
  const [radiusKm, setRadiusKm] = useState("100");
  const [nearbyResults, setNearbyResults] = useState<NearbyMine[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showViolations, setShowViolations] = useState(true);
  const [showInspections, setShowInspections] = useState(false);
  const [selectedMine, setSelectedMine] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"compliance" | "risk" | "violations">("risk");

  const { data: featureData, isLoading: loadingFeatures } = useQuery({
    queryKey: ["gis-features"],
    queryFn: () =>
      gisApi.get("/v1/gis/features").then((r) => r.data as { features: GeoFeature[] }),
    retry: false,
  });

  const { data: heatmapData = [] } = useQuery<HeatPoint[]>({
    queryKey: ["gis-heatmap"],
    queryFn: () => gisApi.get("/v1/gis/heatmap").then((r) => r.data),
    retry: false,
  });

  const { data: rawViolations = [] } = useQuery({
    queryKey: ["violations-map"],
    queryFn: () => violationApi.get("/v1/violations/?size=500").then(r => r.data.items ?? r.data),
    retry: false,
  });

  const { data: rawInspections = [] } = useQuery({
    queryKey: ["inspections-map"],
    queryFn: () => inspectionApi.get("/v1/inspections/?size=500").then(r => r.data.items ?? r.data),
    retry: false,
  });

  const sync = useMutation({
    mutationFn: () => gisApi.post("/v1/gis/sync"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gis-features"] });
      qc.invalidateQueries({ queryKey: ["gis-heatmap"] });
    },
  });

  const searchNearby = useMutation({
    mutationFn: () =>
      gisApi
        .get(`/v1/gis/nearby?lat=${nearbyLat}&lng=${nearbyLng}&radius_km=${radiusKm}`)
        .then((r) => r.data as NearbyMine[]),
    onSuccess: (data) => setNearbyResults(data),
  });

  // Use real API data when available, fall back to demo data
  const features = featureData?.features ?? [];
  const apiMines: MinePinProps[] = features.map((f) => ({
    id: f.properties.mine_id,
    name: f.properties.name,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    risk: f.properties.risk,
    score: f.properties.compliance_score,
    open_violations: f.properties.open_violations,
  }));

  const mapMines = apiMines.length > 0 ? apiMines : DEMO_MINES;
  const mapHeatmap = apiMines.length > 0 ? heatmapData : DEMO_HEATMAP;
  const isDemo = apiMines.length === 0 && !loadingFeatures;

  // Build mine-id → coords map for markers that carry only mine_id
  const mineCoords: Record<string, { lat: number; lng: number; name: string }> = {};
  mapMines.forEach(m => { mineCoords[m.id] = { lat: m.lat, lng: m.lng, name: m.name }; });

  const violationMarkers: ViolationMarker[] = (rawViolations as any[])
    .filter((v: any) => v.location?.lat && v.location?.lng)
    .map((v: any) => ({
      id: v.id,
      lat: v.location.lat,
      lng: v.location.lng,
      severity: v.severity ?? "medium",
      category: v.category ?? "general",
      mine_name: mineCoords[v.mine_id]?.name,
    }));

  const inspectionMarkers: InspectionMarker[] = (rawInspections as any[])
    .filter((i: any) => i.location?.lat && i.location?.lng)
    .map((i: any) => ({
      id: i.id,
      lat: i.location.lat,
      lng: i.location.lng,
      status: i.status ?? "completed",
      mine_name: mineCoords[i.mine_id]?.name,
      conducted_at: i.conducted_at,
    }));

  // Sidebar stats
  const criticalCount = mapMines.filter((m) => m.risk === "CRITICAL").length;
  const activeCount = mapMines.length;
  const highRiskCount = mapMines.filter((m) => m.risk === "CRITICAL" || m.risk === "HIGH").length;
  const totalViolations = mapMines.reduce((s, m) => s + (m.open_violations ?? 0), 0);
  const avgScore = Math.round(mapMines.reduce((s, m) => s + m.score, 0) / (mapMines.length || 1));

  const sortedMines = [...mapMines].sort((a, b) => a.score - b.score);
  const selectedMineData = selectedMine ? mapMines.find((m) => m.id === selectedMine) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Mine Maps"
        description="Geographic overview of mine sites, compliance status, and violation density"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`} />
              Sync Mines
            </Button>
          </div>
        }
      />

      {/* ── Top stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        {loadingFeatures ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-2.5 w-20" />
            </Card>
          ))
        ) : (
          [
            { label: "Total Mines Mapped", value: mapMines.length,  sub: `${activeCount} operational`, color: "text-[#172126]" },
            { label: "High / Critical Risk", value: highRiskCount, sub: "require DGMS attention",      color: "text-[#c0392b]" },
            { label: "Avg Compliance",   value: `${avgScore}%`,   sub: "fleet wide",                color: "text-[#2f6664]" },
            { label: "Open Violations",  value: totalViolations,  sub: "pending resolution",        color: "text-[#b77a45]" },
          ].map((s) => (
            <Card key={s.label} className="p-3">
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.sub}</p>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* ── Main map column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="overflow-hidden">
            {/* Map toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span className="text-sm font-medium">{mapMines.length} mines mapped</span>
                <div className="h-4 w-px bg-[var(--border)]" />
                {/* Layer toggles */}
                <div className="flex items-center gap-1">
                  {(["risk", "compliance", "violations"] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer)}
                      className={`text-xs px-2 py-0.5 rounded-md capitalize transition-colors ${
                        activeLayer === layer
                          ? "bg-[#2f6664] text-white font-medium"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--stone)]/50"
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { key: "heatmap",     label: "Heatmap",     color: "bg-[#c0392b]",    on: showHeatmap,     set: setShowHeatmap },
                  { key: "violations",  label: "Violations",  color: "bg-[#b77a45]", on: showViolations,  set: setShowViolations },
                  { key: "inspections", label: "Inspections", color: "bg-[#2f6664]",   on: showInspections, set: setShowInspections },
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer select-none">
                    <div className={`relative h-4 w-7 rounded-full transition-colors ${t.on ? t.color : "bg-[var(--muted)]"}`}
                      onClick={() => t.set(!t.on)}>
                      <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${t.on ? "translate-x-3.5" : "translate-x-0.5"}`} />
                    </div>
                    <Layers className="h-3.5 w-3.5" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <CardContent className="p-0 h-[480px]">
              {loadingFeatures ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                </div>
              ) : (
                <MineMap
                  mines={mapMines}
                  heatmap={showHeatmap ? mapHeatmap : []}
                  violations={showViolations ? violationMarkers : []}
                  inspections={showInspections ? inspectionMarkers : []}
                  center={[23.5, 85.5]}
                  zoom={6}
                />
              )}
            </CardContent>

            {/* Map legend */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)]/30">
              {Object.entries(riskColor).filter(([k]) => k !== "UNKNOWN").map(([risk, color]) => (
                <div key={risk} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-[var(--muted-foreground)] capitalize">{risk.toLowerCase()}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 opacity-40" />
                <span className="text-xs text-[var(--muted-foreground)]">Violation density</span>
              </div>
            </div>
          </Card>

          {/* Nearby search */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Search className="h-4 w-4" />
                Nearby Mine Search
                <span className="ml-1 text-xs font-normal text-[var(--muted-foreground)]">(PostGIS ST_DWithin)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Latitude</label>
                  <Input
                    value={nearbyLat}
                    onChange={(e) => setNearbyLat(e.target.value)}
                    placeholder="23.8"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Longitude</label>
                  <Input
                    value={nearbyLng}
                    onChange={(e) => setNearbyLng(e.target.value)}
                    placeholder="86.5"
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Radius (km)</label>
                  <Input
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => searchNearby.mutate()}
                    disabled={searchNearby.isPending}
                    size="sm"
                    className="h-10"
                  >
                    {searchNearby.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {nearbyResults.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {nearbyResults.map((m) => (
                    <div
                      key={m.mine_id}
                      className="flex items-center justify-between text-sm border border-[var(--border)] rounded-lg px-3 py-2 hover:bg-[var(--muted)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        <div>
                          <span className="font-medium">{m.name}</span>
                          <span className="ml-2 text-xs text-[var(--muted-foreground)] capitalize">
                            {m.mine_type}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs bg-[var(--muted)] rounded px-1.5 py-0.5">
                        {m.distance_km} km
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {searchNearby.isError && (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  Search failed — GIS service unavailable.
                </p>
              )}
              {searchNearby.isSuccess && nearbyResults.length === 0 && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  No mines found within {radiusKm} km of the given coordinates.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Side panel ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Avg compliance */}
          <Card className="p-4">
            <p className="text-xs text-[var(--muted-foreground)]">Avg. Compliance Score</p>
            <div className="flex items-end gap-2 mt-1">
              <span className={`text-3xl font-bold ${avgScore < 50 ? "text-red-500" : avgScore < 70 ? "text-amber-500" : "text-green-500"}`}>
                {avgScore}%
              </span>
            </div>
            {/* Mini bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--muted)]">
              <div
                className={`h-full rounded-full transition-all ${avgScore < 50 ? "bg-red-500" : avgScore < 70 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${avgScore}%` }}
              />
            </div>
          </Card>

          {/* Selected mine detail */}
          {selectedMineData && (
            <Card className="p-4 border-[var(--primary)]/40">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Selected</p>
              <p className="text-sm font-semibold leading-snug">{selectedMineData.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-[var(--muted)]">
                  <div className="h-full rounded-full" style={{ width: `${selectedMineData.score}%`, background: riskColor[selectedMineData.risk] ?? "#6b7280" }} />
                </div>
                <span className="text-xs font-bold" style={{ color: riskColor[selectedMineData.risk] ?? "#6b7280" }}>
                  {selectedMineData.score}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <Badge variant={riskVariant[selectedMineData.risk]}>{selectedMineData.risk}</Badge>
                <span className={selectedMineData.open_violations ? "text-red-500 font-medium" : "text-green-500"}>
                  {selectedMineData.open_violations ? `${selectedMineData.open_violations} open violations` : "✓ No violations"}
                </span>
              </div>
            </Card>
          )}

          {/* Mine list */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-between">
              Mine List
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                {mapMines.length} sites
              </span>
            </h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
              {loadingFeatures ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <div className="flex justify-between items-center pt-1">
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                ))
              ) : (
                sortedMines.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMine(selectedMine === m.id ? null : m.id)}
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${
                      selectedMine === m.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium leading-tight flex-1">{m.name}</p>
                      <span
                        className="text-xs font-bold shrink-0"
                        style={{ color: riskColor[m.risk] ?? "#6b7280" }}
                      >
                        {m.score}%
                      </span>
                    </div>

                    {/* Score bar */}
                    <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${m.score}%`,
                          background: riskColor[m.risk] ?? "#6b7280",
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-semibold"
                        style={{
                          background: `${riskColor[m.risk] ?? "#6b7280"}18`,
                          color: riskColor[m.risk] ?? "#6b7280",
                        }}
                      >
                        {riskIcon[m.risk]}
                        {m.risk}
                      </div>
                      {(m.open_violations ?? 0) > 0 ? (
                        <span className="text-xs text-red-500 font-medium">
                          {m.open_violations} violation{m.open_violations !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-green-500">✓ Clean</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
