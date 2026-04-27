import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Edit, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNT_TYPES, STATE_CHOICES } from "@/features/admin/form-constants";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DistributorProfile | null>(null);

  const rows = useMemo(() => (data ?? []).filter((d) => `${d.name} ${d.arn} ${d.email} ${d.city}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const openForm = (distributor?: DistributorProfile) => { setEditing(distributor ?? null); setDialogOpen(true); };

  const columns: DataTableColumn<DistributorProfile>[] = [
    { id: "name", header: "Distributor", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.arn} · {r.email}</p></div> },
    { id: "location", header: "Location", sortValue: (r) => r.city, accessor: (r) => <span className="text-sm">{r.city}, {r.state}</span> },
    { id: "clients", header: "Clients", align: "right", sortValue: (r) => r.clientCount, accessor: (r) => r.clientCount },
    { id: "aum", header: "AUM", align: "right", sortValue: (r) => r.aum, accessor: (r) => <span className="font-semibold">{formatCompactINR(r.aum)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    { id: "actions", header: "", align: "right", accessor: (r) => <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openForm(r)}><Edit className="h-3.5 w-3.5" /> Update</Button> },
  ];

  return <><PageHeader eyebrow="RM · Partners" title="Distributor partners" description="Manage distributor partners assigned to your client acquisition desk." actions={<div className="flex gap-2"><Button variant="outline" className="gap-2" onClick={() => toast.success("Distributor upload queued")}><Upload className="h-4 w-4" /> Upload</Button><Button className="gap-2" onClick={() => openForm()}><Plus className="h-4 w-4" /> Create</Button></div>} /><div className="space-y-5 px-6 py-6 sm:px-8"><Card className="shadow-card"><CardContent className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search distributors…" className="pl-9" /></div></CardContent></Card>{isLoading ? <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading distributors…</CardContent></Card> : <DataTable columns={columns} data={rows} initialSortId="aum" pageSize={10} mobileCard={(r) => <div className="space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.arn} · {r.city}</p></div><StatusBadge tone={STATUS_TONE[r.status]} label={r.status} /></div><p className="text-xs text-muted-foreground">{r.clientCount} clients · {formatCompactINR(r.aum)}</p></div>} />}</div><DistributorDialog open={dialogOpen} onOpenChange={setDialogOpen} distributor={editing} /></>;
}

function DistributorDialog({ open, onOpenChange, distributor }: { open: boolean; onOpenChange: (open: boolean) => void; distributor: DistributorProfile | null }) {
  const save = () => { toast.success(distributor ? "Distributor updated" : "Distributor created"); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{distributor ? "Update distributor" : "Create distributor"}</DialogTitle>
          <DialogDescription>RM-managed distributor onboarding — mirrors the Django DistributorProfile model.</DialogDescription>
        </DialogHeader>

        <FormSection title="Identity">
          <Field label="Name"><Input defaultValue={distributor?.name} placeholder="Partner name" /></Field>
          <Field label="Email"><Input type="email" defaultValue={distributor?.email} placeholder="ops@example.in" /></Field>
          <Field label="ARN number"><Input defaultValue={distributor?.arn} placeholder="ARN-000000" /></Field>
          <Field label="Broker code"><Input placeholder="BBF0001 (auto-generated)" /></Field>
          <Field label="Old broker code"><Input placeholder="Legacy code (optional)" /></Field>
          <Field label="EUIN"><Input placeholder="E000000" /></Field>
          <Field label="Status flags">
            <div className="flex h-10 items-center gap-4 rounded-md border border-input px-3">
              <div className="flex items-center gap-2">
                <Switch defaultChecked={distributor?.status !== "suspended"} id="rm-dist-active" />
                <Label htmlFor="rm-dist-active" className="text-sm font-normal text-muted-foreground">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={distributor?.status === "active"} id="rm-dist-approved" />
                <Label htmlFor="rm-dist-approved" className="text-sm font-normal text-muted-foreground">Approved</Label>
              </div>
            </div>
          </Field>
        </FormSection>

        <FormSection title="Contact details">
          <Field label="Mobile"><Input defaultValue={distributor?.phone} placeholder="+91 98xxxxxxxx" /></Field>
          <Field label="Alternate mobile"><Input placeholder="+91…" /></Field>
          <Field label="Alternate email"><Input type="email" placeholder="alt@example.in" /></Field>
        </FormSection>

        <FormSection title="Address">
          <Field label="Address" className="sm:col-span-2"><Textarea rows={2} placeholder="Street, building, area" /></Field>
          <Field label="City"><Input defaultValue={distributor?.city} placeholder="Mumbai" /></Field>
          <Field label="Pincode"><Input maxLength={6} placeholder="400001" /></Field>
          <Field label="State">
            <Select defaultValue={distributor?.state}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>{STATE_CHOICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Country"><Input defaultValue="India" /></Field>
        </FormSection>

        <FormSection title="Personal & business">
          <Field label="Date of birth / incorporation"><Input type="date" /></Field>
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
          <Button onClick={save}>{distributor ? "Save changes" : "Create distributor"}</Button>
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