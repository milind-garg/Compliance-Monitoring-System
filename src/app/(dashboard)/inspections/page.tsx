"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Inspection } from "@/types";

const mock: Inspection[] = [
  { id: "1", mine_id: "m1", mine_name: "Jharia Block-A", inspector_id: "u1", inspector_name: "Arjun Sharma", status: "SCHEDULED", scheduled_date: "2026-09-05" },
  { id: "2", mine_id: "m2", mine_name: "Raniganj North", inspector_id: "u2", inspector_name: "Meena Patel", status: "IN_PROGRESS", scheduled_date: "2026-09-01" },
  { id: "3", mine_id: "m3", mine_name: "Singrauli Zone-3", inspector_id: "u1", inspector_name: "Arjun Sharma", status: "COMPLETED", scheduled_date: "2026-08-20", completed_date: "2026-08-20", score: 88 },
  { id: "4", mine_id: "m4", mine_name: "Dhanbad East", inspector_id: "u3", inspector_name: "Sunita Roy", status: "COMPLETED", scheduled_date: "2026-08-15", completed_date: "2026-08-15", score: 91 },
];

const statusVariant: Record<string, "outline" | "warning" | "success"> = {
  SCHEDULED: "outline",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "outline",
};

export default function InspectionsPage() {
  return (
    <div>
      <PageHeader
        title="Inspections"
        description="Schedule and track mine inspections"
        actions={<Button size="sm"><Plus className="h-4 w-4" />Schedule Inspection</Button>}
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  {["Mine", "Inspector", "Status", "Scheduled", "Completed", "Score"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mock.map((ins) => (
                  <tr key={ins.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer">
                    <td className="px-4 py-3 font-medium">{ins.mine_name}</td>
                    <td className="px-4 py-3">{ins.inspector_name}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[ins.status]}>{ins.status.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{ins.scheduled_date}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{ins.completed_date ?? "—"}</td>
                    <td className="px-4 py-3">{ins.score != null ? `${ins.score}%` : "—"}</td>
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
