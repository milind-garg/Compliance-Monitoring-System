"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Star } from "lucide-react";
import api from "@/lib/api";

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
      api.get("/api/v1/contractors/").then((r) => r.data.items ?? r.data),
  });

  const filtered = contractors.filter(
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
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Contractor
          </Button>
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
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 p-4" />
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
            <Card key={c.id} className="hover:border-primary/50 transition-colors cursor-pointer">
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
                      className={`w-3.5 h-3.5 ${i < Math.round(c.safety_rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
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
