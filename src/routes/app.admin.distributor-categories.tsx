import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Layers } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useDistributorCategoriesQuery } from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate } from "@/lib/format";
import type { DistributorCategory } from "@/types/admin";

export const Route = createFileRoute("/app/admin/distributor-categories")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Distributor categories — Admin" }] }),
  component: DistributorCategoriesPage,
});

const TIER_GRADIENT: Record<DistributorCategory["name"], string> = {
  Platinum: "from-slate-300 to-slate-500",
  Gold: "from-amber-300 to-amber-500",
  Silver: "from-zinc-300 to-zinc-400",
  Bronze: "from-orange-300 to-orange-500",
};

function DistributorCategoriesPage() {
  const { data, isLoading } = useDistributorCategoriesQuery();
  const [editing, setEditing] = useState<DistributorCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const columns: DataTableColumn<DistributorCategory>[] = [
    {
      id: "name",
      header: "Tier",
      sortValue: (r) => r.name,
      accessor: (r) => <span className="font-semibold">{r.name}</span>,
    },
    {
      id: "min",
      header: "Min AUM",
      align: "right",
      sortValue: (r) => r.minAum,
      accessor: (r) => formatCompactINR(r.minAum),
    },
    {
      id: "max",
      header: "Max AUM",
      align: "right",
      sortValue: (r) => r.maxAum ?? Number.POSITIVE_INFINITY,
      accessor: (r) => (r.maxAum == null ? "No cap" : formatCompactINR(r.maxAum)),
    },
    {
      id: "base",
      header: "Base trail",
      align: "right",
      sortValue: (r) => r.baseTrailPct,
      accessor: (r) => `${r.baseTrailPct.toFixed(2)}%`,
    },
    {
      id: "bonus",
      header: "Bonus",
      align: "right",
      sortValue: (r) => r.bonusTrailPct,
      accessor: (r) => `${r.bonusTrailPct.toFixed(2)}%`,
    },
    {
      id: "from",
      header: "Effective from",
      sortValue: (r) => r.effectiveFrom,
      accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.effectiveFrom)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => (
        <StatusBadge tone={r.status === "active" ? "success" : "muted"} label={r.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      accessor: (r) => (
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(r)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Configuration"
        title="Distributor categories"
        description="Configure commission slabs by AUM tier. Changes apply to the next payout cycle."
        actions={
          <Button className="gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(data ?? []).map((c) => (
            <Card key={c.id} className="shadow-card">
              <CardContent className="p-5">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${TIER_GRADIENT[c.name]} text-white shadow-glow`}
                >
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="font-display text-lg font-bold">{c.name}</p>
                  <StatusBadge
                    tone={c.status === "active" ? "success" : "muted"}
                    label={c.status}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  AUM ≥ {formatCompactINR(c.minAum)}
                  {c.maxAum != null ? ` · ≤ ${formatCompactINR(c.maxAum)}` : " · no cap"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="Base trail" value={`${c.baseTrailPct.toFixed(2)}%`} />
                  <Metric label="Bonus" value={`${c.bonusTrailPct.toFixed(2)}%`} />
                  <Metric label="Distributors" value={String(c.distributorCount)} />
                  <Metric label="Effective" value={formatDate(c.effectiveFrom)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Slab configuration</CardTitle>
            <CardDescription>Edit thresholds and trail rates for each tier.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Loading categories…</p>
            ) : (
              <DataTable
                columns={columns}
                data={data ?? []}
                initialSortId="min"
                initialSortDir="desc"
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <CategorySheet
        open={editing != null || creating}
        category={editing}
        creating={creating}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function CategorySheet({
  open,
  category,
  creating,
  onClose,
}: {
  open: boolean;
  category: DistributorCategory | null;
  creating: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{creating ? "New category" : `Edit ${category?.name ?? ""}`}</SheetTitle>
          <SheetDescription>
            Mock form — saving will surface a toast and close the panel.
          </SheetDescription>
        </SheetHeader>
        <form
          className="grid gap-4 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success(creating ? "Category created" : `${category?.name ?? "Category"} updated`);
            onClose();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" defaultValue={category?.name ?? ""} placeholder="e.g. Platinum" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="cat-min">Min AUM (₹)</Label>
              <Input
                id="cat-min"
                type="number"
                min={0}
                defaultValue={category?.minAum ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-max">Max AUM (₹)</Label>
              <Input
                id="cat-max"
                type="number"
                min={0}
                defaultValue={category?.maxAum ?? ""}
                placeholder="Leave blank for no cap"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="cat-base">Base trail %</Label>
              <Input
                id="cat-base"
                type="number"
                step="0.01"
                min={0}
                max={5}
                defaultValue={category?.baseTrailPct ?? 0.5}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-bonus">Bonus trail %</Label>
              <Input
                id="cat-bonus"
                type="number"
                step="0.01"
                min={0}
                max={5}
                defaultValue={category?.bonusTrailPct ?? 0}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-from">Effective from</Label>
            <Input
              id="cat-from"
              type="date"
              defaultValue={category?.effectiveFrom?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
          <SheetFooter className="mt-2 flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{creating ? "Create" : "Save changes"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
