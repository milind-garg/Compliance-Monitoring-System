"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { ComplianceRecord } from "@/types";

const mockRecords: ComplianceRecord[] = [
  { id: "1", mine_id: "m1", mine_name: "Jharia Block-A", status: "NON_COMPLIANT", score: 42, last_inspection: "2026-08-10", violations_count: 8, risk_level: "CRITICAL" },
  { id: "2", mine_id: "m2", mine_name: "Raniganj North", status: "PARTIALLY_COMPLIANT", score: 61, last_inspection: "2026-08-18", violations_count: 4, risk_level: "HIGH" },
  { id: "3", mine_id: "m3", mine_name: "Singrauli Zone-3", status: "COMPLIANT", score: 88, last_inspection: "2026-08-25", violations_count: 1, risk_level: "LOW" },
  { id: "4", mine_id: "m4", mine_name: "Dhanbad East", status: "COMPLIANT", score: 91, last_inspection: "2026-08-22", violations_count: 0, risk_level: "LOW" },
  { id: "5", mine_id: "m5", mine_name: "Bokaro Sector-2", status: "PARTIALLY_COMPLIANT", score: 67, last_inspection: "2026-08-15", violations_count: 3, risk_level: "MEDIUM" },
];

const statusVariant: Record<string, "success" | "danger" | "warning" | "outline"> = {
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  PARTIALLY_COMPLIANT: "warning",
  UNDER_REVIEW: "outline",
};

const riskVariant: Record<string, "success" | "danger" | "warning" | "outline"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "danger",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#27ae60" : score >= 60 ? "#f39c12" : "#e74c3c";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-[var(--muted)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );
}

export default function CompliancePage() {
  const [search, setSearch] = useState("");

  const { data: records = mockRecords } = useQuery<ComplianceRecord[]>({
    queryKey: ["compliance"],
    queryFn: async () => (await api.get("/compliance")).data.items,
    retry: false,
    throwOnError: false,
  });

  const filtered = records.filter(
    (r) =>
      r.mine_name.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        description="Monitor compliance status across all mine sites"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {/* Table toolbar */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                className="pl-9"
                placeholder="Search mines…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} records</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Mine</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Risk Level</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Violations</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">Last Inspection</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{r.mine_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[r.status]}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={r.score} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={riskVariant[r.risk_level]}>{r.risk_level}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">{r.violations_count}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.last_inspection}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-[var(--muted-foreground)]">No records found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
