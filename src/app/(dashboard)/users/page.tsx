"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/lib/services";

interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  organisation_id: string;
}

const roleVariant: Record<string, "default" | "outline"> = {
  admin:    "default",
  manager:  "default",
  inspector: "outline",
  viewer:   "outline",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UsersPage() {
  const { data: users = [], isLoading } = useQuery<UserOut[]>({
    queryKey: ["users"],
    queryFn: () => authApi.get("/v1/users/").then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage inspector and manager accounts"
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
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
