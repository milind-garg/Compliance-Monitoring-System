"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { Mine } from "@/types";

// ── Demo mines lookup ──────────────────────────────────────────────────────
const DEMO_MINES_MAP: Record<string, Mine> = {
  m1: { id: "m1", name: "Jharia Coalfield Alpha",  location: "Dhanbad, Jharkhand",    mine_type: "underground", latitude: 23.755, longitude: 86.415, is_active: true  },
  m2: { id: "m2", name: "Raniganj Central Block",  location: "Paschim Bardhaman, WB", mine_type: "opencast",    latitude: 23.613, longitude: 87.121, is_active: true  },
  m3: { id: "m3", name: "Bokaro Deep Mine",        location: "Bokaro, Jharkhand",     mine_type: "underground", latitude: 23.783, longitude: 85.977, is_active: true  },
  m4: { id: "m4", name: "Dhanbad North Pit",       location: "Dhanbad, Jharkhand",    mine_type: "opencast",    latitude: 23.822, longitude: 86.448, is_active: true  },
  m5: { id: "m5", name: "Ramgarh Underground",     location: "Ramgarh, Jharkhand",    mine_type: "underground", latitude: 23.638, longitude: 85.508, is_active: true  },
  m6: { id: "m6", name: "Giridih Open-cast",       location: "Giridih, Jharkhand",    mine_type: "opencast",    latitude: 24.189, longitude: 86.304, is_active: true  },
  m7: { id: "m7", name: "Hazaribagh East Block",   location: "Hazaribagh, Jharkhand", mine_type: "opencast",    latitude: 24.012, longitude: 85.352, is_active: true  },
  m8: { id: "m8", name: "Korba Main Complex",      location: "Korba, Chhattisgarh",   mine_type: "opencast",    latitude: 22.362, longitude: 82.719, is_active: true  },
  m9: { id: "m9", name: "Talcher Central Mine",    location: "Angul, Odisha",         mine_type: "opencast",    latitude: 20.952, longitude: 85.225, is_active: true  },
  m10: { id: "m10", name: "Singrauli Alpha Seam",   location: "Singrauli, MP",         mine_type: "underground", latitude: 24.199, longitude: 82.672, is_active: false },
};

export default function MineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes((user?.role ?? "").toUpperCase());

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", mine_type: "", latitude: "", longitude: "" });

  const { data: rawMine, isLoading } = useQuery<Mine>({
    queryKey: ["mine", id],
    queryFn: () => authApi.get(`/v1/mines/${id}`).then((r) => r.data),
    retry: false,
  } as any);

  const mine = rawMine ?? (id ? DEMO_MINES_MAP[id] : undefined);

  useEffect(() => {
    if (mine) {
      setForm({
        name: mine.name,
        location: mine.location,
        mine_type: mine.mine_type,
        latitude: mine.latitude != null ? String(mine.latitude) : "",
        longitude: mine.longitude != null ? String(mine.longitude) : "",
      });
    }
  }, [mine]);

  const updateMutation = useMutation({
    mutationFn: () => authApi.patch(`/v1/mines/${id}`, {
      name: form.name,
      location: form.location,
      mine_type: form.mine_type,
      latitude: form.latitude ? parseFloat(form.latitude as string) : null,
      longitude: form.longitude ? parseFloat(form.longitude as string) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mine", id] });
      qc.invalidateQueries({ queryKey: ["mines"] });
      setEditing(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => authApi.patch(`/v1/mines/${id}`, { is_active: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mine", id] }),
  });

  if (isLoading) return (
    <div>
      <PageHeader title="Mine Detail" description="" actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" />Back</Button>} />
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!mine) return (
    <div><PageHeader title="Mine Detail" description="" actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" />Back</Button>} />
      <Card><CardContent className="p-6 text-center text-[var(--muted-foreground)]">Mine not found.</CardContent></Card>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={mine.name}
        description={mine.location}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />Back
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--muted-foreground)]">{mine.location}</span>
            </div>
            <Badge variant={mine.is_active ? "success" : "outline"}>
              {mine.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {!editing ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 text-sm">
              <div><p className="text-xs text-[var(--muted-foreground)]">Type</p><p className="font-medium capitalize">{mine.mine_type.replace("_", " ")}</p></div>
              <div><p className="text-xs text-[var(--muted-foreground)]">Latitude</p><p className="font-medium font-mono">{mine.latitude ?? "—"}</p></div>
              <div><p className="text-xs text-[var(--muted-foreground)]">Longitude</p><p className="font-medium font-mono">{mine.longitude ?? "—"}</p></div>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="mb-1 block text-xs font-medium">Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Location</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Latitude</label>
                  <Input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Longitude</label>
                  <Input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {isAdminOrManager && (
            <div className="mt-6 flex gap-2">
              {!editing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                  {mine.is_active && (
                    <Button size="sm" variant="outline" onClick={() => deactivateMutation.mutate()} disabled={deactivateMutation.isPending}>
                      {deactivateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Deactivate
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
