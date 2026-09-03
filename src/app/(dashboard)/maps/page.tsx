"use client";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Dynamic import required — Leaflet uses browser APIs
const MineMap = dynamic(() => import("@/components/shared/MineMap"), { ssr: false });

const mines = [
  { id: "m1", name: "Jharia Block-A", lat: 23.764, lng: 86.422, risk: "CRITICAL", score: 42 },
  { id: "m2", name: "Raniganj North", lat: 23.623, lng: 87.126, risk: "HIGH", score: 61 },
  { id: "m3", name: "Singrauli Zone-3", lat: 24.202, lng: 82.654, risk: "LOW", score: 88 },
  { id: "m4", name: "Dhanbad East", lat: 23.799, lng: 86.448, risk: "LOW", score: 91 },
  { id: "m5", name: "Bokaro Sector-2", lat: 23.667, lng: 85.985, risk: "MEDIUM", score: 67 },
];

export default function MapsPage() {
  return (
    <div>
      <PageHeader title="Mine Maps" description="Geographic overview of all mine sites and their compliance status" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0 h-[500px]">
              <MineMap mines={mines} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Mine List</h3>
          {mines.map((m) => (
            <div key={m.id} className="rounded-lg border border-[var(--border)] p-3 bg-white">
              <p className="text-sm font-medium">{m.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <Badge variant={m.risk === "CRITICAL" ? "danger" : m.risk === "HIGH" ? "warning" : m.risk === "MEDIUM" ? "outline" : "success"}>
                  {m.risk}
                </Badge>
                <span className="text-sm font-medium">{m.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
