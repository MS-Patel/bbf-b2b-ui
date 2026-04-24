import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRightLeft, Edit, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranchesQuery, useDistributorsQuery, useRmsQuery, useUserMappingsQuery } from "@/features/admin/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { InvestorDistributorMapping, MappingStatus, RmMapping } from "@/types/admin";

export const Route = createFileRoute("/app/admin/mappings")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "User mappings — Admin" }] }),
  component: AdminMappingsPage,
});

const STATUS_TONE: Record<MappingStatus, StatusTone> = { active: "success", pending: "warning", review: "info" };

function AdminMappingsPage() {
  const { data, isLoading } = useUserMappingsQuery();
  const { data: distributors } = useDistributorsQuery();
  const { data: rms } = useRmsQuery();
  const { data: branches } = useBranchesQuery();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<MappingStatus | "all">("all");

  const investorRows = useMemo(() => (data?.investors ?? []).filter((m) => {
    const term = `${m.investorName} ${m.investorEmail} ${m.distributorName} ${m.rmName} ${m.branchName}`.toLowerCase();
    if (stage !== "all" && m.status !== stage) return false;
    if (search && !term.includes(search.toLowerCase())) return false;
    return true;
  }), [data?.investors, search, stage]);

  const rmRows = useMemo(() => (data?.rms ?? []).filter((m) => {
    const term = `${m.rmName} ${m.branchName} ${m.distributorNames.join(" ")}`.toLowerCase();
    if (stage !== "all" && m.status !== stage) return false;
    if (search && !term.includes(search.toLowerCase())) return false;
    return true;
  }), [data?.rms, search, stage]);

  const investorColumns: DataTableColumn<InvestorDistributorMapping>[] = [
    { id: "investor", header: "Investor", sortValue: (r) => r.investorName, accessor: (r) => <div><p className="font-semibold">{r.investorName}</p><p className="text-xs text-muted-foreground">{r.investorEmail}</p></div> },
    { id: "distributor", header: "Distributor", sortValue: (r) => r.distributorName, accessor: (r) => r.distributorName },
    { id: "rm", header: "RM", sortValue: (r) => r.rmName, accessor: (r) => r.rmName },
    { id: "branch", header: "Branch", sortValue: (r) => r.branchName, accessor: (r) => r.branchName },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "mapped", header: "Mapped", sortValue: (r) => r.mappedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.mappedAt)}</span> },
    { id: "action", header: "", align: "right", accessor: (r) => <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success(`Mapping updated for ${r.investorName}`)}><Edit className="h-3.5 w-3.5" /> Remap</Button> },
  ];

  const rmColumns: DataTableColumn<RmMapping>[] = [
    { id: "rm", header: "RM", sortValue: (r) => r.rmName, accessor: (r) => <span className="font-semibold">{r.rmName}</span> },
    { id: "branch", header: "Branch", sortValue: (r) => r.branchName, accessor: (r) => r.branchName },
    { id: "distributors", header: "Distributors", sortValue: (r) => r.distributorNames.length, accessor: (r) => <span className="text-sm">{r.distributorNames.join(", ")}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    { id: "action", header: "", align: "right", accessor: (r) => <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success(`RM mapping updated for ${r.rmName}`)}><ArrowRightLeft className="h-3.5 w-3.5" /> Update</Button> },
  ];

  return <><PageHeader eyebrow="Admin · Mappings" title="User mappings" description="Map investors to distributors, and RMs to branches or distributor partners." /><div className="space-y-5 px-6 py-6 sm:px-8"><Card className="shadow-card"><CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_180px_180px_180px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search investor, RM, distributor, branch…" className="pl-9" /></div><Select value={stage} onValueChange={(v) => setStage(v as MappingStatus | "all")}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="review">Review</SelectItem></SelectContent></Select><Select onValueChange={(v) => toast.success(`Distributor filter: ${v}`)}><SelectTrigger><SelectValue placeholder="Distributor" /></SelectTrigger><SelectContent>{(distributors ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><Select onValueChange={(v) => toast.success(`Branch filter: ${v}`)}><SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger><SelectContent>{(branches ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></CardContent></Card><Tabs defaultValue="investors" className="space-y-4"><TabsList><TabsTrigger value="investors">Investor mappings</TabsTrigger><TabsTrigger value="rms">RM mappings</TabsTrigger></TabsList><TabsContent value="investors">{isLoading ? <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading mappings…</CardContent></Card> : <DataTable columns={investorColumns} data={investorRows} initialSortId="mapped" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between"><div><p className="font-semibold">{r.investorName}</p><p className="text-xs text-muted-foreground">{r.distributorName} · {r.rmName}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div></div>} />}</TabsContent><TabsContent value="rms"><DataTable columns={rmColumns} data={rmRows} initialSortId="updated" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between"><div><p className="font-semibold">{r.rmName}</p><p className="text-xs text-muted-foreground">{r.branchName} · {r.distributorNames.join(", ")}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div></div>} /></TabsContent></Tabs></div></>;
}