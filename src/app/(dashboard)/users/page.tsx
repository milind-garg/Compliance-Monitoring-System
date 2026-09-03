"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const users = [
  { id: "1", name: "Arjun Sharma", email: "arjun@dgms.gov.in", role: "INSPECTOR", mines: 3, status: "ACTIVE" },
  { id: "2", name: "Meena Patel", email: "meena@dgms.gov.in", role: "MANAGER", mines: 8, status: "ACTIVE" },
  { id: "3", name: "Sunita Roy", email: "sunita@dgms.gov.in", role: "INSPECTOR", mines: 2, status: "ACTIVE" },
  { id: "4", name: "Rajesh Kumar", email: "rajesh@coalindia.in", role: "VIEWER", mines: 5, status: "INACTIVE" },
];

const roleVariant: Record<string, "default" | "outline"> = {
  ADMIN: "default",
  MANAGER: "default",
  INSPECTOR: "outline",
  VIEWER: "outline",
};

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage inspector and manager accounts"
        actions={<Button size="sm"><Plus className="h-4 w-4" />Add User</Button>}
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  {["Name", "Email", "Role", "Assigned Mines", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
                          {u.name[0]}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant={roleVariant[u.role]}>{u.role}</Badge></td>
                    <td className="px-4 py-3 text-center">{u.mines}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === "ACTIVE" ? "success" : "outline"}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">Edit</Button>
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
