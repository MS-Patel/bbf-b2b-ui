import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Edit, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRmDistributorsQuery } from "@/features/rm/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { DistributorProfile, PartnerStatus } from "@/types/admin";

export const Route = createFileRoute("/app/rm/distributors")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Distributor partners — RM" }] }),
  component: RmDistributorsPage,
});

const STATUS_TONE: Record<PartnerStatus, StatusTone> = { active: "success", pending: "warning", suspended: "destructive" };

function RmDistributorsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useRmDistributorsQuery(user?.id);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => (data ?? []).filter((d) => `${d.name} ${d.arn} ${d.email} ${d.city}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  const columns: DataTableColumn<DistributorProfile>[] = [
    { id: "name", header: "Distributor", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.arn} · {r.email}</p></div> },
    { id: "location", header: "Location", sortValue: (r) => r.city, accessor: (r) => <span className="text-sm">{r.city}, {r.state}</span> },
    { id: "clients", header: "Clients", align: "right", sortValue: (r) => r.clientCount, accessor: (r) => r.clientCount },
    { id: "aum", header: "AUM", align: "right", sortValue: (r) => r.aum, accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    { id: "actions", header: "", align: "right", accessor: (r) => <Button asChild size="sm" variant="outline" className="gap-1.5"><Link to="/app/rm/distributors/new" search={{ id: r.id }}><Edit className="h-3.5 w-3.5" /> Update</Link></Button> },
  ];

  return <><PageHeader eyebrow="RM · Partners" title="Distributor partners" description="Manage distributor partners assigned to your client acquisition desk." actions={<div className="flex gap-2"><Button variant="outline" className="gap-2" onClick={() => toast.success("Distributor upload queued")}><Upload className="h-4 w-4" /> Upload</Button><Button asChild className="gap-2"><Link to="/app/rm/distributors/new"><Plus className="h-4 w-4" /> Create</Link></Button></div>} /><div className="space-y-5 px-6 py-6 sm:px-8"><Card className="shadow-card"><CardContent className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search distributors…" className="pl-9" /></div></CardContent></Card>{isLoading ? <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading distributors…</CardContent></Card> : <DataTable columns={columns} data={rows} initialSortId="aum" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.arn} · {r.city}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div><p className="text-xs text-muted-foreground">{r.clientCount} clients · {formatCompactINR(r.aum)}</p></div>} />}</div></>;
}
