"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, UserCheck, UserX, Wifi, AlertTriangle,
  Clock, Loader2, Plus, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { gisApi } from "@/lib/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkerSession {
  id: string;
  worker_id: string;
  mine_id: string;
  device_id: string | null;
  worker_name: string | null;
  worker_role: string | null;
  entry_time: string;
  exit_time: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_depth_m: number | null;
  last_ping: string | null;
  status: "inside" | "sos" | "exited";
  sos: boolean;
  duration_minutes: number | null;
}

interface TrackingStats {
  total_inside: number;
  sos_alerts: number;
  by_mine: Record<string, number>;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const now = new Date();
const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

const DEMO_WORKERS: WorkerSession[] = [
  { id: "d1", worker_id: "w1", mine_id: "m1", device_id: "IOT-4821", worker_name: "Rajesh Kumar",    worker_role: "miner",           entry_time: ago(142), exit_time: null, last_lat: 23.7961, last_lng: 86.4301, last_depth_m: 312, last_ping: ago(0.4), status: "inside", sos: false, duration_minutes: 142 },
  { id: "d2", worker_id: "w2", mine_id: "m1", device_id: "IOT-3309", worker_name: "Suresh Yadav",    worker_role: "engineer",        entry_time: ago(87),  exit_time: null, last_lat: 23.7955, last_lng: 86.4312, last_depth_m: 185, last_ping: ago(0.6), status: "inside", sos: false, duration_minutes: 87  },
  { id: "d3", worker_id: "w3", mine_id: "m1", device_id: "IOT-7714", worker_name: "Amit Sharma",     worker_role: "safety officer",  entry_time: ago(210), exit_time: null, last_lat: 23.7948, last_lng: 86.4298, last_depth_m: 0,   last_ping: ago(1.1), status: "inside", sos: false, duration_minutes: 210 },
  { id: "d4", worker_id: "w4", mine_id: "m2", device_id: "IOT-2201", worker_name: "Priya Singh",     worker_role: "supervisor",      entry_time: ago(55),  exit_time: null, last_lat: 23.4521, last_lng: 87.1234, last_depth_m: 98,  last_ping: ago(0.3), status: "inside", sos: false, duration_minutes: 55  },
  { id: "d5", worker_id: "w5", mine_id: "m1", device_id: "IOT-9902", worker_name: "Mohan Das",       worker_role: "miner",           entry_time: ago(320), exit_time: null, last_lat: 23.7972, last_lng: 86.4289, last_depth_m: 440, last_ping: ago(0.8), status: "sos",    sos: true,  duration_minutes: 320 },
  { id: "d6", worker_id: "w6", mine_id: "m2", device_id: "IOT-5543", worker_name: "Deepak Tiwari",   worker_role: "contractor",      entry_time: ago(33),  exit_time: null, last_lat: 23.4518, last_lng: 87.1241, last_depth_m: 22,  last_ping: ago(0.5), status: "inside", sos: false, duration_minutes: 33  },
  { id: "d7", worker_id: "w7", mine_id: "m3", device_id: "IOT-6617", worker_name: "Kavita Mehta",    worker_role: "engineer",        entry_time: ago(178), exit_time: null, last_lat: 24.1023, last_lng: 85.9871, last_depth_m: 260, last_ping: ago(0.2), status: "inside", sos: false, duration_minutes: 178 },
  { id: "d8", worker_id: "w8", mine_id: "m3", device_id: "IOT-8830", worker_name: "Ramesh Gupta",    worker_role: "miner",           entry_time: ago(95),  exit_time: null, last_lat: 24.1031, last_lng: 85.9864, last_depth_m: 195, last_ping: ago(1.4), status: "inside", sos: false, duration_minutes: 95  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(mins: number | null) {
  if (mins === null) return "—";
  if (mins < 60) return `${Math.round(mins)}m`;
  return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
}

function fmtCoords(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) return "—";
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

// ── Simulate IoT entry form ───────────────────────────────────────────────────

function EntryForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("miner");
  const [device, setDevice] = useState("");
  const [mineId, setMineId] = useState("");
  const [lat, setLat] = useState("23.7957");
  const [lng, setLng] = useState("86.4304");
  const [depth, setDepth] = useState("0");

  const enter = useMutation({
    mutationFn: () =>
      gisApi.post("/v1/tracking/entry", {
        worker_id: crypto.randomUUID(),
        mine_id: mineId || crypto.randomUUID(),
        device_id: device || `IOT-${Math.floor(Math.random() * 9000) + 1000}`,
        worker_name: name || "Worker",
        worker_role: role,
        lat: parseFloat(lat) || null,
        lng: parseFloat(lng) || null,
        depth_m: parseFloat(depth) || 0,
      }),
    onSuccess: () => { onSuccess(); setName(""); setDevice(""); },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Simulate Worker Entry (IoT)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium block mb-1">Worker Name</label>
            <Input placeholder="e.g. Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Role</label>
            <select
              className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none"
              value={role} onChange={(e) => setRole(e.target.value)}
            >
              {["miner", "engineer", "supervisor", "safety officer", "contractor"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium block mb-1">Device ID (optional)</label>
            <Input placeholder="e.g. IOT-4821" value={device} onChange={(e) => setDevice(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Depth (m)</label>
            <Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} className="text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium block mb-1">Latitude</label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} className="text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Longitude</label>
            <Input value={lng} onChange={(e) => setLng(e.target.value)} className="text-sm font-mono" />
          </div>
        </div>
        <button
          onClick={() => enter.mutate()}
          disabled={enter.isPending}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {enter.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Register Entry
        </button>
        {enter.isError && (
          <p className="text-xs text-red-500">Entry failed. Is the tracking service running?</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkerTrackingPage() {
  const qc = useQueryClient();
  const refetch = () => {
    qc.invalidateQueries({ queryKey: ["tracking-active"] });
    qc.invalidateQueries({ queryKey: ["tracking-stats"] });
  };

  const { data: activeRaw = [], isLoading } = useQuery<WorkerSession[]>({
    queryKey: ["tracking-active"],
    queryFn: () => gisApi.get("/v1/tracking/active").then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: stats } = useQuery<TrackingStats>({
    queryKey: ["tracking-stats"],
    queryFn: () => gisApi.get("/v1/tracking/stats").then((r) => r.data),
    refetchInterval: 10_000,
  });

  const isDemo = activeRaw.length === 0 && !isLoading;
  const active = isDemo ? DEMO_WORKERS : activeRaw;

  const checkout = useMutation({
    mutationFn: (workerId: string) => gisApi.post("/v1/tracking/exit", { worker_id: workerId }),
    onSuccess: refetch,
  });

  const triggerSOS = useMutation({
    mutationFn: (s: WorkerSession) =>
      gisApi.post("/v1/tracking/ping", {
        worker_id: s.worker_id,
        lat: s.last_lat ?? 23.7957,
        lng: s.last_lng ?? 86.4304,
        sos: true,
      }),
    onSuccess: refetch,
  });

  return (
    <div>
      <PageHeader
        title="Worker Geotracking"
        description="Real-time IoT locket/wristband tracking of workers inside the mine"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            <button onClick={refetch} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--stone)] transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        }
      />

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Inside Mine", value: stats?.total_inside ?? active.length, icon: UserCheck, color: "text-green-600" },
          { label: "SOS Alerts", value: stats?.sos_alerts ?? active.filter((s) => s.sos).length, icon: AlertTriangle, color: "text-red-500" },
          { label: "Last Ping", value: active.length ? fmt(active[0]?.last_ping ?? null) : "—", icon: Wifi, color: "text-blue-500" },
          { label: "Avg. Duration", value: active.length ? fmtDuration(active.reduce((a, s) => a + (s.duration_minutes ?? 0), 0) / active.length) : "—", icon: Clock, color: "text-[var(--primary)]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--stone)] flex items-center justify-center shrink-0">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
                <p className="text-xl font-bold text-[var(--foreground)]">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Active workers table ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Active Workers</CardTitle>
              <span className="text-xs text-[var(--muted-foreground)]">Auto-refreshes every 10 s</span>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : active.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <MapPin className="h-8 w-8 text-[var(--muted-foreground)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">No workers inside the mine.</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Use the form on the right to simulate an IoT entry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                        {["Worker", "Role", "Device", "Location", "Depth", "In Since", "Duration", "Status", ""].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--foreground)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {active.map((s) => (
                        <tr
                          key={s.id}
                          className={`border-b border-[var(--border)] transition-colors ${s.sos ? "bg-red-500/8" : "hover:bg-[var(--stone)]/40"}`}
                        >
                          <td className="px-3 py-2.5 font-medium">
                            <div className="flex items-center gap-2">
                              {s.sos && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                              {s.worker_name ?? s.worker_id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 capitalize text-[var(--muted-foreground)]">{s.worker_role ?? "—"}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-[var(--muted-foreground)]">{s.device_id ?? "—"}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{fmtCoords(s.last_lat, s.last_lng)}</td>
                          <td className="px-3 py-2.5 text-xs text-[var(--muted-foreground)]">
                            {s.last_depth_m !== null ? `${s.last_depth_m}m` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-[var(--muted-foreground)]">{fmt(s.entry_time)}</td>
                          <td className="px-3 py-2.5 text-xs">{fmtDuration(s.duration_minutes)}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={s.sos ? "danger" : "success"}>
                              {s.sos ? "SOS" : "INSIDE"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              {!s.sos && (
                                <button
                                  onClick={() => triggerSOS.mutate(s)}
                                  title="Trigger SOS"
                                  className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => checkout.mutate(s.worker_id)}
                                title="Check out worker"
                                className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--stone)] transition-colors"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Entry form ───────────────────────────────────────────────────── */}
        <div>
          <EntryForm onSuccess={refetch} />

          <Card className="mt-4">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--foreground)]">How it works</p>
              <ul className="text-xs text-[var(--muted-foreground)] space-y-1.5">
                <li className="flex gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--primary)]" />IoT locket/wristband sends a GPS ping every 30 s</li>
                <li className="flex gap-2"><Wifi className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />Location updates via <code className="bg-[var(--stone)] px-1 rounded">POST /v1/tracking/ping</code></li>
                <li className="flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />SOS button on device triggers immediate alert</li>
                <li className="flex gap-2"><UserX className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--muted-foreground)]" />Exit gate scanner closes the session automatically</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
