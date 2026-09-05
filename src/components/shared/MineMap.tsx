"use client";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

function makeIcon(color: string, size = 10) {
  return L.divIcon({
    className: "",
    html: `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="2"/>
    </svg>`,
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
  });
}

const riskPinColor: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH:     "#f97316",
  MEDIUM:   "#eab308",
  LOW:      "#16a34a",
  UNKNOWN:  "#6b7280",
};

function makeMineIcon(risk: string) {
  const color = riskPinColor[risk] ?? "#6b7280";
  return L.divIcon({
    className: "",
    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });
}

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

export interface ViolationMarker {
  id: string;
  lat: number;
  lng: number;
  severity: string;
  category: string;
  mine_name?: string;
}

export interface InspectionMarker {
  id: string;
  lat: number;
  lng: number;
  status: string;
  mine_name?: string;
  conducted_at?: string;
}

interface Props {
  mines: MinePinProps[];
  heatmap?: HeatPoint[];
  violations?: ViolationMarker[];
  inspections?: InspectionMarker[];
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

const severityColor: Record<string, string> = {
  critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#22c55e",
};

const inspectionStatusColor: Record<string, string> = {
  completed: "#22c55e", in_progress: "#3b82f6", scheduled: "#a855f7", overdue: "#dc2626",
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

export default function MineMap({
  mines, heatmap = [], violations = [], inspections = [],
  center = [23.8, 86.5], zoom = 7,
}: Props) {
  const maxWeight = Math.max(...heatmap.map((h) => h.weight), 1);

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Violation heatmap circles */}
      {heatmap.filter((h) => h.weight > 0).map((h) => (
        <Circle
          key={`heat-${h.mine_id}`}
          center={[h.lat, h.lng]}
          radius={8000 + (h.weight / maxWeight) * 30000}
          pathOptions={{ color: "transparent", fillColor: "#dc2626", fillOpacity: 0.1 + (h.weight / maxWeight) * 0.4 }}
        />
      ))}

      {/* Mine markers */}
      {mines.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={makeMineIcon(m.risk)}>
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-semibold mb-1">{m.name}</p>
              <p className="text-gray-600 mb-1">Compliance: <b>{m.score}%</b></p>
              {m.open_violations !== undefined && (
                <p className="text-gray-600 mb-1">Open violations: <b>{m.open_violations}</b></p>
              )}
              <span className="inline-block px-2 py-0.5 rounded text-white text-xs font-bold"
                style={{ background: riskColor[m.risk] ?? "#6b7280" }}>
                {m.risk}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Violation markers — colored dots by severity */}
      {violations.map((v) => (
        <Marker
          key={`viol-${v.id}`}
          position={[v.lat, v.lng]}
          icon={makeIcon(severityColor[v.severity] ?? "#6b7280", 8)}
        >
          <Popup>
            <div className="text-sm min-w-[140px]">
              <p className="font-semibold capitalize mb-0.5">{v.category}</p>
              {v.mine_name && <p className="text-gray-500 text-xs mb-0.5">{v.mine_name}</p>}
              <span className="inline-block px-1.5 py-0.5 rounded text-white text-xs font-bold"
                style={{ background: severityColor[v.severity] ?? "#6b7280" }}>
                {v.severity.toUpperCase()}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Inspection markers — colored dots by status */}
      {inspections.map((i) => (
        <Marker
          key={`insp-${i.id}`}
          position={[i.lat, i.lng]}
          icon={makeIcon(inspectionStatusColor[i.status] ?? "#6b7280", 7)}
        >
          <Popup>
            <div className="text-sm min-w-[140px]">
              <p className="font-semibold mb-0.5">Inspection</p>
              {i.mine_name && <p className="text-gray-500 text-xs mb-0.5">{i.mine_name}</p>}
              {i.conducted_at && <p className="text-gray-500 text-xs mb-0.5">{new Date(i.conducted_at).toLocaleDateString()}</p>}
              <span className="inline-block px-1.5 py-0.5 rounded text-white text-xs font-bold capitalize"
                style={{ background: inspectionStatusColor[i.status] ?? "#6b7280" }}>
                {i.status.replace("_", " ")}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      {mines.length > 0 && <FitBounds mines={mines} />}
    </MapContainer>
  );
}
