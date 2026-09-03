"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";

// Fix default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Mine {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: string;
  score: number;
}

export default function MineMap({ mines }: { mines: Mine[] }) {
  return (
    <MapContainer
      center={[23.8, 86.5]}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mines.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{m.name}</p>
              <p className="text-[var(--muted-foreground)]">Compliance: {m.score}%</p>
              <Badge variant={m.risk === "CRITICAL" ? "danger" : m.risk === "HIGH" ? "warning" : "outline"}>
                {m.risk}
              </Badge>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
