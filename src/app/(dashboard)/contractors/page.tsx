"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { contractorApi } from "@/lib/services";

type Contractor = {
  id: string;
  name: string;
  license_no: string;
  contact_email: string;
  mine_id: string;
  status: "active" | "inactive" | "suspended";
  safety_rating: number;
  contract_start: string;
  contract_end: string;
};

// ── Demo data (shown when API returns no contractors) ─────────────────────────
const DEMO_CONTRACTORS: Contractor[] = [
  { id: "c1", name: "Ravi Mining & Infra Pvt. Ltd.",     license_no: "LIC-2021-JH-04291", contact_email: "ops@ravimining.in",       mine_id: "m1", status: "active",    safety_rating: 4.5, contract_start: "2024-04-01", contract_end: "2026-03-31" },
  { id: "c2", name: "Bharat Excavations Ltd.",           license_no: "LIC-2019-WB-00871", contact_email: "contact@bharatexc.com",  mine_id: "m2", status: "active",    safety_rating: 3.8, contract_start: "2023-07-01", contract_end: "2025-06-30" },
  { id: "c3", name: "Jharkhand Drill & Blast Co.",       license_no: "LIC-2022-JH-11032", contact_email: "admin@jdblast.in",       mine_id: "m1", status: "active",    safety_rating: 4.2, contract_start: "2024-01-15", contract_end: "2025-12-31" },
  { id: "c4", name: "Eastern Colliery Services",         license_no: "LIC-2020-OD-00562", contact_email: "info@easterncs.co.in",  mine_id: "m3", status: "suspended", safety_rating: 2.1, contract_start: "2022-06-01", contract_end: "2024-05-31" },
  { id: "c5", name: "Nagpur Heavy Equipment Corp.",      license_no: "LIC-2023-MH-07831", contact_email: "nhe@nagpurheavy.com",   mine_id: "m4", status: "active",    safety_rating: 4.8, contract_start: "2025-01-01", contract_end: "2026-12-31" },
  { id: "c6", name: "Damodar Valley Contractors",        license_no: "LIC-2018-WB-00129", contact_email: "dvc@damodarvc.in",      mine_id: "m2", status: "inactive",  safety_rating: 3.1, contract_start: "2021-03-01", contract_end: "2023-02-28" },
  { id: "c7", name: "CIL Approved Drilling Solutions",   license_no: "LIC-2024-JH-15501", contact_email: "cds@cildrilling.co.in", mine_id: "m5", status: "active",    safety_rating: 4.6, contract_start: "2025-04-01", contract_end: "2027-03-31" },
  { id: "c8", name: "Singrauli Surface Works Pvt. Ltd.", license_no: "LIC-2021-MP-00984", contact_email: "ssw@singrauliworks.in", mine_id: "m6", status: "active",    safety_rating: 3.6, contract_start: "2023-10-01", contract_end: "2025-09-30" },
];
// ─────────────────────────────────────────────────────────────────────────────

const statusVariant: Record<string, "default" | "outline"> = {
  active: "default",
  inactive: "outline",
  suspended: "outline",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ContractorsPage() {
  const [search, setSearch] = useState("");

  const { data: contractors = [], isLoading } = useQuery<Contractor[]>({
    queryKey: ["contractors"],
    queryFn: () =>
      contractorApi.get("/v1/contractors/").then((r) => r.data.items ?? r.data),
  });

  // Fall back to demo data when the API returns nothing
  const displayData = contractors.length > 0 ? contractors : DEMO_CONTRACTORS;
  const isDemo = contractors.length === 0 && !isLoading;

  const filtered = displayData.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.license_no.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Contractors"
        description="Manage contractors and their safety ratings"
        actions={
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-xs bg-[#b77a45]/15 text-[#874f20] border border-[#b77a45]/30 rounded-full px-2.5 py-0.5 font-medium">
                Demo data
              </span>
            )}
            <Button size="sm" variant="secondary">
              <Plus className="w-4 h-4 mr-1" /> Add Contractor
            </Button>
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search contractors…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-3.5 w-3.5 rounded-full" />
                  ))}
                  <Skeleton className="h-3 w-6 ml-1" />
                </div>
                <div className="space-y-1 pt-1">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No contractors found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:border-[#2f6664]/60 transition-colors cursor-pointer">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.license_no}</p>
                  </div>
                  <Badge variant={statusVariant[c.status] ?? "outline"} className="shrink-0 text-xs capitalize">
                    {c.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(c.safety_rating) ? "fill-[#b77a45] text-[#b77a45]" : "text-muted-foreground"}`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{c.safety_rating.toFixed(1)}</span>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{c.contact_email}</p>
                  <p>
                    {fmt(c.contract_start)} – {fmt(c.contract_end)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
