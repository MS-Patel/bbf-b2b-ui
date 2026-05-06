import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, FileSpreadsheet, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useMasterDataQuery } from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import type { AMCMaster } from "@/types/admin";

export const Route = createFileRoute("/app/admin/products-upload")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Products & NAV — Admin" }] }),
  component: AdminProductsUploadPage,
});

const schemeSchema = z.object({
  amcCode: z.string().min(1, "Select an AMC"),
  fileName: z.string().min(1, "Choose a CSV file"),
});
const navSchema = z.object({
  effectiveDate: z.string().min(1, "Pick a date"),
  fileName: z.string().min(1, "Choose a CSV file"),
});

interface SchemePreview {
  id: string;
  schemeCode: string;
  name: string;
  amcName: string;
  category: string;
  plan: "Direct" | "Regular";
  nav: number;
  navAt: string;
}

const SCHEMES_PREVIEW: SchemePreview[] = [
  { id: "s1", schemeCode: "120503", name: "Axis Bluechip Fund — Direct Growth", amcName: "Axis Mutual Fund", category: "Large Cap", plan: "Direct", nav: 58.42, navAt: "2026-04-15" },
  { id: "s2", schemeCode: "118989", name: "Mirae Asset Large Cap Fund — Direct", amcName: "Mirae Asset", category: "Large Cap", plan: "Direct", nav: 102.18, navAt: "2026-04-15" },
  { id: "s3", schemeCode: "125354", name: "Parag Parikh Flexi Cap — Direct Growth", amcName: "PPFAS", category: "Flexi Cap", plan: "Direct", nav: 81.55, navAt: "2026-04-15" },
  { id: "s4", schemeCode: "118533", name: "HDFC Liquid Fund — Direct Growth", amcName: "HDFC AMC", category: "Liquid", plan: "Direct", nav: 4810.12, navAt: "2026-04-15" },
  { id: "s5", schemeCode: "120822", name: "ICICI Balanced Advantage — Direct", amcName: "ICICI Prudential", category: "Hybrid", plan: "Direct", nav: 67.94, navAt: "2026-04-15" },
  { id: "s6", schemeCode: "120716", name: "Nippon India Small Cap — Direct Growth", amcName: "Nippon India", category: "Small Cap", plan: "Direct", nav: 188.21, navAt: "2026-04-15" },
];

export default function AdminProductsUploadPage() {
  const { data, isLoading } = useMasterDataQuery();
  const amcs = data?.amcs ?? [];
  const [search, setSearch] = useState("");

  const filteredAmcs = amcs.filter((a) => `${a.name} ${a.code} ${a.registrar}`.toLowerCase().includes(search.toLowerCase()));
  const filteredSchemes = SCHEMES_PREVIEW.filter((s) => `${s.name} ${s.schemeCode} ${s.amcName} ${s.category}`.toLowerCase().includes(search.toLowerCase()));

  const amcColumns: DataTableColumn<AMCMaster>[] = [
    { id: "amc", header: "AMC", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.code}</p></div> },
    { id: "registrar", header: "Registrar", sortValue: (r) => r.registrar, accessor: (r) => r.registrar },
    { id: "schemes", header: "Active schemes", align: "right", sortValue: (r) => r.activeSchemes, accessor: (r) => r.activeSchemes },
    { id: "nav", header: "Last NAV", sortValue: (r) => r.lastNavAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.lastNavAt)}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={r.status === "active" ? "success" : "warning"} label={r.status} /> },
  ];

  const schemeColumns: DataTableColumn<SchemePreview>[] = [
    { id: "scheme", header: "Scheme", sortValue: (r) => r.name, accessor: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.schemeCode} · {r.amcName}</p></div> },
    { id: "category", header: "Category", sortValue: (r) => r.category, accessor: (r) => r.category },
    { id: "plan", header: "Plan", sortValue: (r) => r.plan, accessor: (r) => r.plan },
    { id: "nav", header: "NAV", align: "right", sortValue: (r) => r.nav, accessor: (r) => <span className="font-semibold tabular-nums">₹{r.nav.toFixed(2)}</span> },
    { id: "navAt", header: "NAV date", sortValue: (r) => r.navAt, accessor: (r) => <span className="text-muted-foreground">{formatDate(r.navAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Products"
        title="Products & NAV operations"
        description="Bulk-upload mutual fund scheme master data and daily NAV files. Preview AMCs and schemes already imported."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <SchemeUploadForm amcs={amcs} />
          <NavUploadForm />
        </div>

        <Tabs defaultValue="amcs" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="amcs">AMCs</TabsTrigger>
              <TabsTrigger value="schemes">Schemes</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
            </div>
          </div>
          <TabsContent value="amcs">
            {isLoading ? <LoadingCard /> : <DataTable columns={amcColumns} data={filteredAmcs} initialSortId="amc" initialSortDir="asc" pageSize={8} />}
          </TabsContent>
          <TabsContent value="schemes">
            <DataTable columns={schemeColumns} data={filteredSchemes} initialSortId="scheme" initialSortDir="asc" pageSize={8} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function SchemeUploadForm({ amcs }: { amcs: AMCMaster[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof schemeSchema>>({
    resolver: zodResolver(schemeSchema),
    defaultValues: { amcCode: "", fileName: "" },
  });

  function onSubmit(values: z.infer<typeof schemeSchema>) {
    toast.success(`Scheme master queued`, { description: `${values.fileName} · AMC ${values.amcCode}` });
    form.reset({ amcCode: "", fileName: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Scheme master upload</CardTitle>
            <CardDescription>Import scheme metadata, AMFI codes, categories and plan options.</CardDescription>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>AMC</Label>
            <Select value={form.watch("amcCode")} onValueChange={(v) => form.setValue("amcCode", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select AMC" /></SelectTrigger>
              <SelectContent>
                {amcs.map((a) => (
                  <SelectItem key={a.id} value={a.code}>{a.name} ({a.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.amcCode && <p className="text-xs text-destructive">{form.formState.errors.amcCode.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Scheme CSV</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => form.setValue("fileName", e.currentTarget.files?.[0]?.name ?? "", { shouldValidate: true })}
            />
            {form.formState.errors.fileName && <p className="text-xs text-destructive">{form.formState.errors.fileName.message}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="gap-2"><Upload className="h-4 w-4" /> Upload schemes</Button>
            <Button type="button" variant="outline" className="gap-2" onClick={() => toast.success("Scheme template downloaded")}>
              <Download className="h-4 w-4" /> Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function NavUploadForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<z.infer<typeof navSchema>>({
    resolver: zodResolver(navSchema),
    defaultValues: { effectiveDate: today, fileName: "" },
  });

  function onSubmit(values: z.infer<typeof navSchema>) {
    toast.success(`NAV file queued`, { description: `${values.fileName} · effective ${values.effectiveDate}` });
    form.reset({ effectiveDate: today, fileName: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Daily NAV upload</CardTitle>
            <CardDescription>Import NAV by scheme code with effective date. Validation runs server-side.</CardDescription>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Effective date</Label>
            <Input type="date" {...form.register("effectiveDate")} />
            {form.formState.errors.effectiveDate && <p className="text-xs text-destructive">{form.formState.errors.effectiveDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>NAV CSV</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => form.setValue("fileName", e.currentTarget.files?.[0]?.name ?? "", { shouldValidate: true })}
            />
            {form.formState.errors.fileName && <p className="text-xs text-destructive">{form.formState.errors.fileName.message}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="gap-2"><Upload className="h-4 w-4" /> Upload NAVs</Button>
            <Button type="button" variant="outline" className="gap-2" onClick={() => toast.success("NAV template downloaded")}>
              <Download className="h-4 w-4" /> Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>;
}
