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
import { gisApi } from "@/lib/services";
import type { MinePinProps, HeatPoint } from "@/components/shared/MineMap";

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

  // Sidebar stats
  const criticalCount = mapMines.filter((m) => m.risk === "CRITICAL").length;
  const highCount     = mapMines.filter((m) => m.risk === "HIGH").length;
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
              <span className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
            >
              {sync.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              Sync Mines
            </Button>
          </div>
        }
      />

      {/* Top stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Mines",      value: mapMines.length,  sub: "across all regions",       color: "text-[var(--foreground)]"  },
          { label: "Critical Risk",    value: criticalCount,    sub: "require immediate action",  color: "text-red-500"              },
          { label: "High Risk",        value: highCount,        sub: "close monitoring needed",   color: "text-orange-500"           },
          { label: "Open Violations",  value: totalViolations,  sub: "pending resolution",        color: "text-amber-500"            },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.sub}</p>
          </Card>
        ))}
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
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer select-none">
                <div
                  className={`relative h-4 w-7 rounded-full transition-colors ${showHeatmap ? "bg-red-500" : "bg-[var(--muted)]"}`}
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  <div
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${showHeatmap ? "translate-x-3.5" : "translate-x-0.5"}`}
                  />
                </div>
                <Layers className="h-3.5 w-3.5" />
                Violation heatmap
              </label>
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

          {/* Mine list */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center justify-between">
              Mine List
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                {mapMines.length} sites
              </span>
            </h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
              {sortedMines.map((m) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
