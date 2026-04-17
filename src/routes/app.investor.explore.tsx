import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SchemeCard } from "@/features/schemes/components/scheme-card";
import { useSchemesQuery } from "@/features/schemes/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import type { AssetClass } from "@/types/portfolio";
import type { RiskLevel } from "@/types/scheme";

export const Route = createFileRoute("/app/investor/explore")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Explore Schemes — WealthOS" }] }),
  component: ExplorePage,
});

type SortKey = "return1y" | "return3y" | "aumCr" | "rating";

const ASSET_OPTIONS: Array<{ value: "all" | AssetClass; label: string }> = [
  { value: "all", label: "All assets" },
  { value: "equity", label: "Equity" },
  { value: "debt", label: "Debt" },
  { value: "hybrid", label: "Hybrid" },
  { value: "gold", label: "Gold" },
  { value: "international", label: "International" },
];

const RISK_OPTIONS: Array<{ value: "all" | RiskLevel; label: string }> = [
  { value: "all", label: "Any risk" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "moderately_high", label: "Mod-High" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very High" },
];

function ExplorePage() {
  const { data, isLoading } = useSchemesQuery();
  const [query, setQuery] = useState("");
  const [asset, setAsset] = useState<"all" | AssetClass>("all");
  const [risk, setRisk] = useState<"all" | RiskLevel>("all");
  const [sort, setSort] = useState<SortKey>("return1y");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data
      .filter((s) => {
        if (q && !(s.schemeName.toLowerCase().includes(q) || s.amc.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))) return false;
        if (asset !== "all" && s.assetClass !== asset) return false;
        if (risk !== "all" && s.risk !== risk) return false;
        return true;
      })
      .sort((a, b) => b[sort] - a[sort]);
  }, [data, query, asset, risk, sort]);

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Explore Schemes"
        description="Browse the full universe of mutual funds available on BSE Star MF, filter by risk, and invest in one click."
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by scheme, AMC, or category…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={asset} onValueChange={(v) => setAsset(v as typeof asset)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={risk} onValueChange={(v) => setRisk(v as typeof risk)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return1y">1Y returns</SelectItem>
                  <SelectItem value="return3y">3Y returns</SelectItem>
                  <SelectItem value="aumCr">AUM</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading schemes…" : `${filtered.length} schemes`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
            <p className="text-sm text-muted-foreground">No schemes match your filters. Try widening your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <SchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
