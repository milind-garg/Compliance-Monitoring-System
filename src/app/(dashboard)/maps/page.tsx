"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, RefreshCw, Search } from "lucide-react";
import { gisApi } from "@/lib/services";
import type { MinePinProps, HeatPoint } from "@/components/shared/MineMap";

const MineMap = dynamic(() => import("@/components/shared/MineMap"), { ssr: false });

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

const riskVariant: Record<string, "danger" | "warning" | "outline" | "success"> = {
  CRITICAL: "danger",
  HIGH:     "warning",
  MEDIUM:   "outline",
  LOW:      "success",
  UNKNOWN:  "outline",
};

export default function MapsPage() {
  const qc = useQueryClient();
  const [nearbyLat, setNearbyLat] = useState("23.8");
  const [nearbyLng, setNearbyLng] = useState("86.5");
  const [radiusKm, setRadiusKm] = useState("100");
  const [nearbyResults, setNearbyResults] = useState<NearbyMine[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const { data: featureData, isLoading: loadingFeatures } = useQuery({
    queryKey: ["gis-features"],
    queryFn: () => gisApi.get("/v1/gis/features").then((r) => r.data as { features: GeoFeature[] }),
  });

  const { data: heatmapData = [] } = useQuery<HeatPoint[]>({
    queryKey: ["gis-heatmap"],
    queryFn: () => gisApi.get("/v1/gis/heatmap").then((r) => r.data),
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

  const features = featureData?.features ?? [];
  const mapMines: MinePinProps[] = features.map((f) => ({
    id: f.properties.mine_id,
    name: f.properties.name,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    risk: f.properties.risk,
    score: f.properties.compliance_score,
    open_violations: f.properties.open_violations,
  }));

  return (
    <div>
      <PageHeader
        title="Mine Maps"
        description="Geographic overview of mine sites, compliance status, and violation density"
        actions={
          <Button size="sm" variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            {sync.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Sync Mines
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Map */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
              <span className="text-sm font-medium">{mapMines.length} mines mapped</span>
              <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded"
                />
                Violation heatmap
              </label>
            </div>
            <CardContent className="p-0 h-[500px]">
              {loadingFeatures ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                </div>
              ) : mapMines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <MapPin className="h-8 w-8" />
                  <p>No mine locations in GIS database.</p>
                  <Button size="sm" onClick={() => sync.mutate()} disabled={sync.isPending}>
                    {sync.isPending ? "Syncing…" : "Sync from auth-service"}
                  </Button>
                </div>
              ) : (
                <MineMap
                  mines={mapMines}
                  heatmap={showHeatmap ? heatmapData : []}
                />
              )}
            </CardContent>
          </Card>

          {/* Nearby search */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Search className="h-4 w-4" /> Nearby Mine Search (PostGIS ST_DWithin)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs text-[var(--muted-foreground)]">Latitude</label>
                  <Input value={nearbyLat} onChange={(e) => setNearbyLat(e.target.value)} className="mt-1" />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs text-[var(--muted-foreground)]">Longitude</label>
                  <Input value={nearbyLng} onChange={(e) => setNearbyLng(e.target.value)} className="mt-1" />
                </div>
                <div className="w-24">
                  <label className="text-xs text-[var(--muted-foreground)]">Radius (km)</label>
                  <Input value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} className="mt-1" />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => searchNearby.mutate()} disabled={searchNearby.isPending} size="sm">
                    {searchNearby.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>
              {nearbyResults.length > 0 && (
                <div className="mt-3 space-y-1">
                  {nearbyResults.map((m) => (
                    <div key={m.mine_id} className="flex items-center justify-between text-sm border border-[var(--border)] rounded px-3 py-1.5">
                      <div>
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">{m.mine_type}</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">{m.distance_km} km</span>
                    </div>
                  ))}
                </div>
              )}
              {searchNearby.isSuccess && nearbyResults.length === 0 && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">No mines within {radiusKm} km.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Mine List ({mapMines.length})</h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {[...mapMines]
              .sort((a, b) => a.score - b.score)
              .map((m) => (
                <div key={m.id} className="rounded-lg border border-[var(--border)] p-3 bg-[var(--card)]">
                  <p className="text-sm font-medium leading-tight">{m.name}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <Badge variant={riskVariant[m.risk] ?? "outline"}>{m.risk}</Badge>
                    <span className="text-sm font-semibold">{m.score}%</span>
                  </div>
                  {(m.open_violations ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-[var(--danger)]">{m.open_violations} open violation{m.open_violations !== 1 ? "s" : ""}</p>
                  )}
                </div>
              ))}
            {mapMines.length === 0 && !loadingFeatures && (
              <p className="text-sm text-[var(--muted-foreground)]">Sync mines to see the list.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
