import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileSpreadsheet, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasterDataQuery } from "@/features/admin/api";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { AMCMaster, MasterUploadRun, MasterUploadStatus } from "@/types/admin";

export const Route = createFileRoute("/app/admin/master-data")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Master data — Admin" }] }),
  component: AdminMasterDataPage,
});

const UPLOAD_TONE: Record<MasterUploadStatus, StatusTone> = { processed: "success", processing: "info", failed: "destructive" };

function AdminMasterDataPage() {
  const { data, isLoading } = useMasterDataQuery();
  const [search, setSearch] = useState("");
  const uploads = data?.uploads ?? [];
  const amcs = (data?.amcs ?? []).filter((amc) => `${amc.name} ${amc.code} ${amc.registrar}`.toLowerCase().includes(search.toLowerCase()));

  const uploadColumns: DataTableColumn<MasterUploadRun>[] = [
    { id: "file", header: "File", sortValue: (r) => r.fileName, accessor: (r) => <div><p className="font-semibold">{r.fileName}</p><p className="text-xs text-muted-foreground">{r.type === "navs" ? "NAV upload" : "Scheme upload"}</p></div> },
    { id: "records", header: "Records", align: "right", sortValue: (r) => r.records, accessor: (r) => r.records.toLocaleString("en-IN") },
    { id: "errors", header: "Errors", align: "right", sortValue: (r) => r.errors, accessor: (r) => r.errors ? <span className="text-destructive">{r.errors}</span> : "—" },
    { id: "uploaded", header: "Uploaded", sortValue: (r) => r.uploadedAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.uploadedAt)}</span> },
    { id: "by", header: "Uploaded by", sortValue: (r) => r.uploadedBy, accessor: (r) => r.uploadedBy },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={UPLOAD_TONE[r.status]} label={r.status} /> },
  ];

  const amcColumns: DataTableColumn<AMCMaster>[] = [
    { id: "amc", header: "AMC", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.code}</p></div> },
    { id: "registrar", header: "Registrar", sortValue: (r) => r.registrar, accessor: (r) => r.registrar },
    { id: "schemes", header: "Active schemes", align: "right", sortValue: (r) => r.activeSchemes, accessor: (r) => r.activeSchemes },
    { id: "nav", header: "Last NAV", sortValue: (r) => r.lastNavAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.lastNavAt)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={r.status === "active" ? "success" : "warning"} label={r.status} /> },
  ];

  return (
    <>
      <PageHeader eyebrow="Admin · Configuration" title="System configuration & master data" description="Upload scheme and NAV CSV files, download templates, and browse AMC master records." />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <UploadPanel title="Scheme master upload" description="Import scheme metadata, categories, AMFI codes, and plan options." sample="Download scheme sample" />
          <UploadPanel title="NAV upload" description="Import daily NAVs by scheme code with effective dates and validation." sample="Download NAV sample" />
        </div>
        <Tabs defaultValue="uploads" className="space-y-4">
          <TabsList><TabsTrigger value="uploads">Upload history</TabsTrigger><TabsTrigger value="amcs">AMC master</TabsTrigger></TabsList>
          <TabsContent value="uploads">{isLoading ? <LoadingCard label="Loading upload runs…" /> : <DataTable columns={uploadColumns} data={uploads} initialSortId="uploaded" pageSize={8} />}</TabsContent>
          <TabsContent value="amcs" className="space-y-4"><Card className="shadow-card"><CardContent className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search AMC, code, registrar…" className="pl-9" /></div></CardContent></Card>{isLoading ? <LoadingCard label="Loading AMC master…" /> : <DataTable columns={amcColumns} data={amcs} initialSortId="amc" initialSortDir="asc" pageSize={8} />}</TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function UploadPanel({ title, description, sample }: { title: string; description: string; sample: string }) {
  return <Card className="shadow-card"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div><div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow"><FileSpreadsheet className="h-4.5 w-4.5" /></div></div></CardHeader><CardContent className="space-y-4"><Alert><Upload className="h-4 w-4" /><AlertTitle>CSV validation enabled</AlertTitle><AlertDescription>Mock upload checks file type and records the run in the upload history.</AlertDescription></Alert><div className="flex flex-col gap-2 sm:flex-row"><Input type="file" accept=".csv" onChange={(e) => e.currentTarget.files?.[0] && toast.success(`${e.currentTarget.files[0].name} queued for processing`)} /><Button variant="outline" className="gap-2" onClick={() => toast.success(sample)}><Download className="h-4 w-4" /> {sample}</Button></div></CardContent></Card>;
}

function LoadingCard({ label }: { label: string }) {
  return <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">{label}</CardContent></Card>;
}