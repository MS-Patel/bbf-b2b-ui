import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Edit, MoreHorizontal, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRmsQuery } from "@/features/admin/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { PartnerStatus, RmProfile } from "@/types/admin";

export const Route = createFileRoute("/app/admin/rms")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "RM management — Admin" }] }),
  component: AdminRmsPage,
});

const STATUS_TONE: Record<PartnerStatus, StatusTone> = { active: "success", pending: "warning", suspended: "destructive" };

function AdminRmsPage() {
  const { data, isLoading } = useRmsQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PartnerStatus | "all">("all");

  const rows = useMemo(() => (data ?? []).filter((rm) => {
    const term = `${rm.name} ${rm.employeeCode} ${rm.email} ${rm.branchName} ${rm.distributorNames.join(" ")}`.toLowerCase();
    if (status !== "all" && rm.status !== status) return false;
    if (search && !term.includes(search.toLowerCase())) return false;
    return true;
  }), [data, search, status]);

  const columns: DataTableColumn<RmProfile>[] = [
    { id: "name", header: "RM", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.employeeCode} · {r.email}</p></div> },
    { id: "branch", header: "Branch", sortValue: (r) => r.branchName, accessor: (r) => r.branchName },
    { id: "distributors", header: "Distributors", sortValue: (r) => r.distributorNames.length, accessor: (r) => <span className="text-sm">{r.distributorNames.join(", ") || "—"}</span> },
    { id: "clients", header: "Clients", align: "right", sortValue: (r) => r.clientCount, accessor: (r) => r.clientCount },
    { id: "aum", header: "AUM", align: "right", sortValue: (r) => r.aum, accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    { id: "actions", header: "", align: "right", accessor: (r) => <RowActions rm={r} /> },
  ];

  return <><PageHeader eyebrow="Admin · Team" title="RM management" description="List, create, bulk upload, and update relationship manager records." actions={<div className="flex gap-2"><Button variant="outline" className="gap-2" onClick={() => toast.success("RM CSV accepted for validation")}><Upload className="h-4 w-4" /> Bulk upload</Button><Button asChild className="gap-2"><Link to="/app/admin/rms/new" search={{ id: undefined }}><Plus className="h-4 w-4" /> Create RM</Link></Button></div>} /><div className="space-y-5 px-6 py-6 sm:px-8"><Card className="shadow-card"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search RM, code, email, branch, distributor…" className="pl-9" /></div><Select value={status} onValueChange={(v) => setStatus(v as PartnerStatus | "all")}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></CardContent></Card>{isLoading ? <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading RMs…</CardContent></Card> : <DataTable columns={columns} data={rows} initialSortId="aum" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.employeeCode} · {r.branchName}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div><p className="text-xs text-muted-foreground">{r.clientCount} clients · {r.distributorNames.join(", ") || "No distributors"}</p></div>} />}</div></>;
}

function RowActions({ rm }: { rm: RmProfile }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to="/app/admin/rms/new" search={{ id: rm.id }}><Edit className="mr-2 h-4 w-4" /> Update RM</Link></DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast.error(`${rm.name} marked for deletion`)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
