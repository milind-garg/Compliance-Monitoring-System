"use client";
import { useState } from "react";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, MapPin } from "lucide-react";
import { authApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { Mine } from "@/types";

const MINE_TYPES = ["underground", "opencast", "quarry", "placer", "solution"];

// ── Demo data (shown when API returns no mines) ───────────────────────────────
const DEMO_MINES: Mine[] = [
  { id: "m1", name: "Jharia Coalfield Alpha",  location: "Dhanbad, Jharkhand",    mine_type: "underground", latitude: 23.755, longitude: 86.415, is_active: true  },
  { id: "m2", name: "Raniganj Central Block",  location: "Paschim Bardhaman, WB", mine_type: "opencast",    latitude: 23.613, longitude: 87.121, is_active: true  },
  { id: "m3", name: "Bokaro Deep Mine",        location: "Bokaro, Jharkhand",     mine_type: "underground", latitude: 23.783, longitude: 85.977, is_active: true  },
  { id: "m4", name: "Dhanbad North Pit",       location: "Dhanbad, Jharkhand",    mine_type: "opencast",    latitude: 23.822, longitude: 86.448, is_active: true  },
  { id: "m5", name: "Ramgarh Underground",     location: "Ramgarh, Jharkhand",    mine_type: "underground", latitude: 23.638, longitude: 85.508, is_active: true  },
  { id: "m6", name: "Giridih Open-cast",       location: "Giridih, Jharkhand",    mine_type: "opencast",    latitude: 24.189, longitude: 86.304, is_active: true  },
  { id: "m7", name: "Hazaribagh East Block",   location: "Hazaribagh, Jharkhand", mine_type: "opencast",    latitude: 24.012, longitude: 85.352, is_active: true  },
  { id: "m8", name: "Korba Main Complex",      location: "Korba, Chhattisgarh",   mine_type: "opencast",    latitude: 22.362, longitude: 82.719, is_active: true  },
  { id: "m9", name: "Talcher Central Mine",    location: "Angul, Odisha",         mine_type: "opencast",    latitude: 20.952, longitude: 85.225, is_active: true  },
  { id: "m10",name: "Singrauli Alpha Seam",    location: "Singrauli, MP",         mine_type: "underground", latitude: 24.199, longitude: 82.672, is_active: false },
];
// ─────────────────────────────────────────────────────────────────────────────

function AddMineModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", location: "", mine_type: "underground", latitude: "", longitude: "" });

  const create = useMutation({
    mutationFn: () => authApi.post("/v1/mines/", {
      name: form.name,
      location: form.location,
      mine_type: form.mine_type,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mines"] }); onClose(); },
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-[var(--card)] p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold">Add Mine</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Mine Name *</label>
            <Input placeholder="e.g. North Shaft" {...field("name")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Location *</label>
            <Input placeholder="e.g. Dhanbad, Jharkhand" {...field("location")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Mine Type</label>
            <select {...field("mine_type")}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]">
              {MINE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Latitude</label>
              <Input type="number" step="any" placeholder="23.7957" {...field("latitude")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Longitude</label>
              <Input type="number" step="any" placeholder="86.4304" {...field("longitude")} />
            </div>
          </div>
          {create.isError && (
            <p className="text-xs text-[var(--danger)]">Failed to create mine. Check your inputs.</p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="secondary" onClick={() => create.mutate()} disabled={!form.name.trim() || !form.location.trim() || create.isPending}>
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Create Mine
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MinesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes((user?.role ?? "").toUpperCase());
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [{ data: mines = [], isLoading }] = useQueries({
    queries: [
      { queryKey: ["mines"], queryFn: () => authApi.get("/v1/mines/").then((r) => r.data as Mine[]) },
    ],
  });

  // Fall back to demo data when the API returns nothing
  const displayMines = mines.length > 0 ? mines : DEMO_MINES;
  const isDemo = mines.length === 0 && !isLoading;

  const filtered = displayMines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.location.toLowerCase().includes(search.toLowerCase()) ||
    m.mine_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {showAdd && <AddMineModal onClose={() => setShowAdd(false)} />}
      <PageHeader
        title="Mines"
        description="Registered mine sites in your organisation"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            {isAdminOrManager && (
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Mine
              </Button>
            )}
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input className="pl-9" placeholder="Search mines…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} sites</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                  {["Mine Name", "Location", "Type", "Coordinates", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton rows={6} cols={5} />
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No mines found.</td></tr>
                ) : filtered.map((mine) => (
                  <tr key={mine.id} onClick={() => router.push(`/mines/${mine.id}`)} className="border-b border-[var(--border)] hover:bg-[var(--stone)]/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium">{mine.name}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{mine.location}</span>
                    </td>
                    <td className="px-4 py-3 capitalize">{mine.mine_type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] font-mono text-xs">
                      {mine.latitude != null && mine.longitude != null
                        ? `${mine.latitude.toFixed(4)}, ${mine.longitude.toFixed(4)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={mine.is_active ? "success" : "outline"}>
                        {mine.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
