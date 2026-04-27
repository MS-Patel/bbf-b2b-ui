import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Edit, MoreHorizontal, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNT_TYPES, STATE_CHOICES } from "@/features/admin/form-constants";
import { useBranchesQuery, useDistributorsQuery, useRmsQuery } from "@/features/admin/api";
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
  const { data: branches } = useBranchesQuery();
  const { data: distributors } = useDistributorsQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PartnerStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RmProfile | null>(null);

  const rows = useMemo(() => (data ?? []).filter((rm) => {
    const term = `${rm.name} ${rm.employeeCode} ${rm.email} ${rm.branchName} ${rm.distributorNames.join(" ")}`.toLowerCase();
    if (status !== "all" && rm.status !== status) return false;
    if (search && !term.includes(search.toLowerCase())) return false;
    return true;
  }), [data, search, status]);

  const openForm = (rm?: RmProfile) => { setEditing(rm ?? null); setDialogOpen(true); };

  const columns: DataTableColumn<RmProfile>[] = [
    { id: "name", header: "RM", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.employeeCode} · {r.email}</p></div> },
    { id: "branch", header: "Branch", sortValue: (r) => r.branchName, accessor: (r) => r.branchName },
    { id: "distributors", header: "Distributors", sortValue: (r) => r.distributorNames.length, accessor: (r) => <span className="text-sm">{r.distributorNames.join(", ") || "—"}</span> },
    { id: "clients", header: "Clients", align: "right", sortValue: (r) => r.clientCount, accessor: (r) => r.clientCount },
    { id: "aum", header: "AUM", align: "right", sortValue: (r) => r.aum, accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    { id: "actions", header: "", align: "right", accessor: (r) => <RowActions rm={r} onEdit={openForm} /> },
  ];

  return <><PageHeader eyebrow="Admin · Team" title="RM management" description="List, create, bulk upload, and update relationship manager records." actions={<div className="flex gap-2"><Button variant="outline" className="gap-2" onClick={() => toast.success("RM CSV accepted for validation")}><Upload className="h-4 w-4" /> Bulk upload</Button><Button className="gap-2" onClick={() => openForm()}><Plus className="h-4 w-4" /> Create RM</Button></div>} /><div className="space-y-5 px-6 py-6 sm:px-8"><Card className="shadow-card"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search RM, code, email, branch, distributor…" className="pl-9" /></div><Select value={status} onValueChange={(v) => setStatus(v as PartnerStatus | "all")}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></CardContent></Card>{isLoading ? <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading RMs…</CardContent></Card> : <DataTable columns={columns} data={rows} initialSortId="aum" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.employeeCode} · {r.branchName}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div><p className="text-xs text-muted-foreground">{r.clientCount} clients · {r.distributorNames.join(", ") || "No distributors"}</p></div>} />}</div><RmDialog open={dialogOpen} onOpenChange={setDialogOpen} rm={editing} branches={branches ?? []} distributors={distributors ?? []} /></>;
}

function RowActions({ rm, onEdit }: { rm: RmProfile; onEdit: (rm: RmProfile) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onEdit(rm)}><Edit className="mr-2 h-4 w-4" /> Update RM</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast.error(`${rm.name} marked for deletion`)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function RmDialog({ open, onOpenChange, rm, branches, distributors }: { open: boolean; onOpenChange: (open: boolean) => void; rm: RmProfile | null; branches: Array<{ id: string; name: string }>; distributors: Array<{ id: string; name: string }> }) {
  const save = () => { toast.success(rm ? "RM updated" : "RM created"); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rm ? "Update RM" : "Create RM"}</DialogTitle>
          <DialogDescription>Mock form mirroring the Django RMProfile model — identity, address, contact, personal, and bank details.</DialogDescription>
        </DialogHeader>

        <FormSection title="Identity & assignment">
          <Field label="Full name"><Input defaultValue={rm?.name} placeholder="RM name" /></Field>
          <Field label="Employee code"><Input defaultValue={rm?.employeeCode} placeholder="RM-MUM-001" /></Field>
          <Field label="Email"><Input type="email" defaultValue={rm?.email} placeholder="rm@buybestfin.app" /></Field>
          <Field label="Branch">
            <Select defaultValue={rm?.branchId ?? branches[0]?.id}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Primary distributor">
            <Select defaultValue={rm?.distributorIds[0] ?? distributors[0]?.id}>
              <SelectTrigger><SelectValue placeholder="Select distributor" /></SelectTrigger>
              <SelectContent>{distributors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Active">
            <div className="flex h-10 items-center gap-3 rounded-md border border-input px-3">
              <Switch defaultChecked={rm?.status !== "suspended"} id="rm-active" />
              <Label htmlFor="rm-active" className="text-sm font-normal text-muted-foreground">RM profile is active</Label>
            </div>
          </Field>
        </FormSection>

        <FormSection title="Contact details">
          <Field label="Mobile"><Input defaultValue={rm?.phone} placeholder="+91 98xxxxxxxx" /></Field>
          <Field label="Alternate mobile"><Input placeholder="+91…" /></Field>
          <Field label="Alternate email"><Input type="email" placeholder="alt@example.in" /></Field>
        </FormSection>

        <FormSection title="Address">
          <Field label="Address" className="sm:col-span-2"><Textarea rows={2} placeholder="Street, building, area" /></Field>
          <Field label="City"><Input placeholder="Mumbai" /></Field>
          <Field label="Pincode"><Input maxLength={6} placeholder="400001" /></Field>
          <Field label="State">
            <Select>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>{STATE_CHOICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Country"><Input defaultValue="India" /></Field>
        </FormSection>

        <FormSection title="Personal & business">
          <Field label="Date of birth"><Input type="date" /></Field>
          <Field label="PAN"><Input maxLength={10} placeholder="ABCDE1234F" className="uppercase" /></Field>
          <Field label="GSTIN"><Input maxLength={15} placeholder="22ABCDE1234F1Z5" className="uppercase" /></Field>
        </FormSection>

        <FormSection title="Bank details">
          <Field label="Bank name"><Input placeholder="HDFC Bank" /></Field>
          <Field label="Account number"><Input placeholder="00112233445566" /></Field>
          <Field label="IFSC code"><Input maxLength={11} placeholder="HDFC0000123" className="uppercase" /></Field>
          <Field label="Account type">
            <Select defaultValue="SB">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACCOUNT_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Branch name"><Input placeholder="Andheri West" /></Field>
        </FormSection>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{rm ? "Save changes" : "Create RM"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Separator />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}