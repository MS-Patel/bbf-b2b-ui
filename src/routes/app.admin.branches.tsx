import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Edit, MapPin, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchesQuery } from "@/features/admin/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { Branch, BranchStatus } from "@/types/admin";

export const Route = createFileRoute("/app/admin/branches")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Branch management — Admin" }] }),
  component: AdminBranchesPage,
});

const STATUS_TONE: Record<BranchStatus, StatusTone> = { active: "success", inactive: "muted" };

function AdminBranchesPage() {
  const { data, isLoading } = useBranchesQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BranchStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const rows = useMemo(() => (data ?? []).filter((branch) => {
    const term = `${branch.name} ${branch.code} ${branch.city} ${branch.manager}`.toLowerCase();
    if (status !== "all" && branch.status !== status) return false;
    if (search && !term.includes(search.toLowerCase())) return false;
    return true;
  }), [data, search, status]);

  const openForm = (branch?: Branch) => {
    setEditing(branch ?? null);
    setDialogOpen(true);
  };

  const columns: DataTableColumn<Branch>[] = [
    { id: "branch", header: "Branch", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.code}</p></div> },
    { id: "location", header: "Location", sortValue: (r) => r.city, accessor: (r) => <span className="inline-flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{r.city}, {r.state}</span> },
    { id: "manager", header: "Manager", sortValue: (r) => r.manager, accessor: (r) => r.manager },
    { id: "rms", header: "RMs", align: "right", sortValue: (r) => r.rmCount, accessor: (r) => r.rmCount },
    { id: "distributors", header: "Distributors", align: "right", sortValue: (r) => r.distributorCount, accessor: (r) => r.distributorCount },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    { id: "actions", header: "", align: "right", accessor: (r) => <RowActions branch={r} onEdit={openForm} /> },
  ];

  return (
    <>
      <PageHeader eyebrow="Admin · Configuration" title="Branch management" description="Maintain branch offices and ownership for RM and distributor mapping." actions={<Button className="gap-2" onClick={() => openForm()}><Plus className="h-4 w-4" /> Create branch</Button>} />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branch, code, city, manager…" className="pl-9" /></div><Select value={status} onValueChange={(v) => setStatus(v as BranchStatus | "all")}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></CardContent></Card>
        {isLoading ? <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading branches…</CardContent></Card> : <DataTable columns={columns} data={rows} initialSortId="updated" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.code} · {r.city}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div><p className="text-xs text-muted-foreground">{r.rmCount} RMs · {r.distributorCount} distributors · {r.manager}</p></div>} />}
      </div>
      <BranchDialog open={dialogOpen} onOpenChange={setDialogOpen} branch={editing} />
    </>
  );
}

function RowActions({ branch, onEdit }: { branch: Branch; onEdit: (branch: Branch) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onEdit(branch)}><Edit className="mr-2 h-4 w-4" /> Update branch</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast.error(`${branch.name} marked for deletion`)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function BranchDialog({ open, onOpenChange, branch }: { open: boolean; onOpenChange: (open: boolean) => void; branch: Branch | null }) {
  const save = () => { toast.success(branch ? "Branch updated" : "Branch created"); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{branch ? "Update branch" : "Create branch"}</DialogTitle><DialogDescription>Mock form wired to typed hooks; backend mutation can replace this later.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Branch name</Label><Input defaultValue={branch?.name} placeholder="Mumbai Central" /></div><div className="space-y-2"><Label>Code</Label><Input defaultValue={branch?.code} placeholder="MUM-CEN" /></div><div className="space-y-2"><Label>City</Label><Input defaultValue={branch?.city} placeholder="Mumbai" /></div><div className="space-y-2"><Label>State</Label><Input defaultValue={branch?.state} placeholder="Maharashtra" /></div><div className="space-y-2 sm:col-span-2"><Label>Branch manager</Label><Input defaultValue={branch?.manager} placeholder="Manager name" /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>{branch ? "Save changes" : "Create branch"}</Button></DialogFooter></DialogContent></Dialog>;
}