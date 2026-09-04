"use client";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface MinePinProps {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: string;
  score: number;
  open_violations?: number;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
  mine_id: string;
  mine_name: string;
}

interface Props {
  mines: MinePinProps[];
  heatmap?: HeatPoint[];
  center?: [number, number];
  zoom?: number;
}

const riskColor: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH:     "#f97316",
  MEDIUM:   "#eab308",
  LOW:      "#16a34a",
  UNKNOWN:  "#6b7280",
};

function FitBounds({ mines }: { mines: MinePinProps[] }) {
  const map = useMap();
  useEffect(() => {
    if (mines.length === 0) return;
    const bounds = L.latLngBounds(mines.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [mines, map]);
  return null;
}

export default function MineMap({ mines, heatmap = [], center = [23.8, 86.5], zoom = 7 }: Props) {
  const maxWeight = Math.max(...heatmap.map((h) => h.weight), 1);

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Heatmap circles — sized + colored by violation weight */}
      {heatmap.filter((h) => h.weight > 0).map((h) => (
        <Circle
          key={`heat-${h.mine_id}`}
          center={[h.lat, h.lng]}
          radius={8000 + (h.weight / maxWeight) * 30000}
          pathOptions={{
            color: "transparent",
            fillColor: "#dc2626",
            fillOpacity: 0.1 + (h.weight / maxWeight) * 0.4,
          }}
        />
      ))}

      {/* Mine markers */}
      {mines.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-semibold mb-1">{m.name}</p>
              <p className="text-[var(--muted-foreground)] mb-1">Compliance: <b>{m.score}%</b></p>
              {m.open_violations !== undefined && (
                <p className="text-[var(--muted-foreground)] mb-1">Open violations: <b>{m.open_violations}</b></p>
              )}
              <span
                className="inline-block px-2 py-0.5 rounded text-white text-xs font-bold"
                style={{ background: riskColor[m.risk] ?? "#6b7280" }}
              >
                {m.risk}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      {mines.length > 0 && <FitBounds mines={mines} />}
    </MapContainer>
  );
}
