"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, UserX, UserCheck } from "lucide-react";
import { authApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  organisation_id: string;
}

const ROLES = ["admin", "manager", "inspector", "viewer"];

const roleVariant: Record<string, "default" | "outline"> = {
  admin: "default",
  manager: "default",
  inspector: "outline",
  viewer: "outline",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Demo data (shown when API returns no users) ───────────────────────────────
const DEMO_USERS: UserOut[] = [
  { id: "u1", full_name: "Admin User",          email: "admin@navyug.com",          role: "admin",     is_active: true,  created_at: "2026-09-03T10:00:00Z", organisation_id: "org1" },
  { id: "u2", full_name: "Rajesh Kumar",         email: "rajesh.kumar@navyug.com",   role: "manager",   is_active: true,  created_at: "2026-09-03T10:30:00Z", organisation_id: "org1" },
  { id: "u3", full_name: "Anita Sharma",         email: "anita.sharma@navyug.com",   role: "inspector", is_active: true,  created_at: "2026-09-04T09:00:00Z", organisation_id: "org1" },
  { id: "u4", full_name: "Mohan Prasad",         email: "mohan.prasad@navyug.com",   role: "inspector", is_active: true,  created_at: "2026-09-04T09:30:00Z", organisation_id: "org1" },
  { id: "u5", full_name: "Sunita Devi",          email: "sunita.devi@navyug.com",    role: "viewer",    is_active: true,  created_at: "2026-09-04T11:00:00Z", organisation_id: "org1" },
  { id: "u6", full_name: "Vikram Singh",         email: "vikram.singh@navyug.com",   role: "manager",   is_active: true,  created_at: "2026-09-04T14:00:00Z", organisation_id: "org1" },
  { id: "u7", full_name: "Priya Nair",           email: "priya.nair@navyug.com",     role: "inspector", is_active: true,  created_at: "2026-09-05T08:00:00Z", organisation_id: "org1" },
  { id: "u8", full_name: "Deepak Yadav",         email: "deepak.yadav@navyug.com",   role: "inspector", is_active: false, created_at: "2026-09-05T08:30:00Z", organisation_id: "org1" },
  { id: "u9", full_name: "DGMS Inspector (RO)",  email: "dgms.ro@gov.in",            role: "viewer",    is_active: true,  created_at: "2026-09-05T10:00:00Z", organisation_id: "org2" },
];
// ─────────────────────────────────────────────────────────────────────────────

function AddUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "inspector" });
  const [err, setErr] = useState("");

  const create = useMutation({
    mutationFn: () => authApi.post("/v1/users/", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onClose(); },
    onError: (e: any) => setErr(e?.response?.data?.detail ?? "Failed to create user."),
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-[var(--card)] p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold">Add User</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Full Name *</label>
            <Input placeholder="Jane Doe" {...field("full_name")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Email *</label>
            <Input type="email" placeholder="jane@example.com" {...field("email")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Password *</label>
            <Input type="password" placeholder="Min. 8 characters" {...field("password")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Role</label>
            <select {...field("role")}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]">
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
          {err && <p className="text-xs text-[var(--danger)]">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="secondary"
            onClick={() => create.mutate()}
            disabled={!form.full_name.trim() || !form.email.trim() || form.password.length < 8 || create.isPending}>
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Create User
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const canView = isAdmin || role === "MANAGER";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: users = [], isLoading, error } = useQuery<UserOut[]>({
    queryKey: ["users"],
    queryFn: () => authApi.get("/v1/users/").then((r) => r.data.items ?? r.data),
    enabled: canView,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      authApi.patch(`/v1/users/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  if (!canView) {
    return (
      <div>
        <PageHeader title="User Management" description="Manage inspector and manager accounts" />
        <Card><CardContent className="p-6 text-center text-[var(--muted-foreground)]">
          You need Admin or Manager access to view this page.
        </CardContent></Card>
      </div>
    );
  }

  // Fall back to demo data when the API returns nothing
  const displayUsers = users.length > 0 ? users : DEMO_USERS;
  const isDemo = users.length === 0 && !isLoading && !error;

  const filtered = displayUsers.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
      <PageHeader
        title="User Management"
        description="Manage inspector and manager accounts"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            {isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add User
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
              <Input className="pl-9" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--stone)]/60">
                  {["Name", "Email", "Role", "Status", "Joined", ...(isAdmin ? ["Actions"] : [])].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)] animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      {isAdmin && <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>}
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-[var(--danger)]">Failed to load users.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No users found.</td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--stone)]/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                          {(u.full_name || u.email)[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{u.full_name || u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant[u.role] ?? "outline"}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? "success" : "outline"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(u.created_at)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                          disabled={toggleActive.isPending}
                          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          title={u.is_active ? "Deactivate" : "Activate"}
                        >
                          {u.is_active
                            ? <UserX className="h-4 w-4 text-[var(--danger)]" />
                            : <UserCheck className="h-4 w-4 text-green-600" />}
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    )}
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
