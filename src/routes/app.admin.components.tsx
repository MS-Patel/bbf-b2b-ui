import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Activity,
  Banknote,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  TrendingUp,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AuditTrail,
  BulkActionBar,
  ConfirmationDialog,
  DataTable,
  EmptyState,
  ErrorState,
  FilterToolbar,
  InfoDrawer,
  KPIWidget,
  RelationshipCard,
  SearchBar,
  StatusBadge,
  StepForm,
  TabbedDetailLayout,
  Timeline,
  UploadZone,
  type DataTableColumn,
  type StepDefinition,
  type UploadZoneFile,
} from "@/components/admin";
import {
  SHOWCASE_AUDIT,
  SHOWCASE_STEPS,
  SHOWCASE_TIMELINE,
  SHOWCASE_UPLOAD_FILES,
} from "@/components/admin/_fixtures";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/app/admin/components")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Components Library — Admin" }] }),
  component: ComponentsShowcasePage,
});

interface DemoRow {
  id: string;
  name: string;
  pan: string;
  status: "verified" | "pending" | "rejected";
  aum: number;
}

const DEMO_ROWS: DemoRow[] = [
  { id: "r1", name: "Anil Kumar", pan: "ABCDE1234F", status: "verified", aum: 4_250_000 },
  { id: "r2", name: "Sunita Rao", pan: "BCDEF2345G", status: "pending", aum: 1_120_000 },
  { id: "r3", name: "Rohit Mehta", pan: "CDEFG3456H", status: "verified", aum: 8_900_000 },
  { id: "r4", name: "Meera Iyer", pan: "DEFGH4567I", status: "rejected", aum: 0 },
  { id: "r5", name: "Vikram Singh", pan: "EFGHI5678J", status: "verified", aum: 2_300_000 },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>
      <Card>
        <CardContent className="p-5">{children}</CardContent>
      </Card>
    </section>
  );
}

function ComponentsShowcasePage() {
  // DataTable + Bulk demo
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filteredRows = DEMO_ROWS.filter((r) => {
    const matchesSearch = `${r.name} ${r.pan}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const activeCount = (search ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const columns: DataTableColumn<DemoRow>[] = [
    {
      id: "name",
      header: "Investor",
      sortValue: (r) => r.name,
      accessor: (r) => (
        <div>
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{r.pan}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "KYC",
      sortValue: (r) => r.status,
      accessor: (r) => (
        <StatusBadge
          tone={r.status === "verified" ? "success" : r.status === "pending" ? "warning" : "destructive"}
          label={r.status}
        />
      ),
    },
    {
      id: "aum",
      header: "AUM",
      align: "right",
      sortValue: (r) => r.aum,
      accessor: (r) => `₹${(r.aum / 100000).toFixed(2)} L`,
    },
  ];

  // StepForm demo
  const [stepId, setStepId] = useState(SHOWCASE_STEPS[0].id);
  const steps: StepDefinition[] = SHOWCASE_STEPS.map((s, i) => ({
    ...s,
    status: i < 2 ? "complete" : i === 2 ? "current" : "pending",
  }));
  const currentIdx = steps.findIndex((s) => s.id === stepId);

  // Drawer + confirm demo
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Upload demo
  const [files, setFiles] = useState<UploadZoneFile[]>(SHOWCASE_UPLOAD_FILES);

  return (
    <>
      <PageHeader
        eyebrow="Admin · System"
        title="Components library"
        description="Reusable building blocks for operational admin UI. Drop these into any new page; props are typed and backend-agnostic."
        actions={
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
            Phase 1
          </Badge>
        }
      />

      <div className="space-y-8 px-6 py-6 sm:px-8">
        {/* KPI Widgets */}
        <Section title="KPIWidget" description="Top-of-page metrics with delta, icon, and optional sparkline slot.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KPIWidget label="Total AUM" value="₹4,820 Cr" icon={Wallet} delta={{ value: "+2.4%", direction: "up" }} hint="vs last month" />
            <KPIWidget label="Active investors" value="12,408" icon={Users} delta={{ value: "+186", direction: "up" }} />
            <KPIWidget label="Orders today" value="342" icon={Activity} delta={{ value: "-12", direction: "down" }} />
            <KPIWidget label="KYC pending" value="48" icon={TrendingUp} delta={{ value: "0", direction: "flat" }} />
          </div>
        </Section>

        {/* Filter Toolbar + SearchBar + DataTable selectable + BulkActionBar */}
        <Section
          title="FilterToolbar + SearchBar + DataTable (selectable) + BulkActionBar"
          description="A complete listing pattern: search, filters, row selection, and contextual bulk actions."
        >
          <div className="space-y-3">
            <FilterToolbar
              search={<SearchBar value={search} onChange={setSearch} placeholder="Search investor or PAN" />}
              activeCount={activeCount}
              onReset={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              filters={
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="KYC status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              }
              actions={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Export
                </Button>
              }
            />
            <DataTable
              columns={columns}
              data={filteredRows}
              pageSize={10}
              selectable
              selectedIds={selected}
              onSelectionChange={setSelected}
              rowActions={(row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDrawerOpen(true)}>
                      <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remove {row.name.split(" ")[0]}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
            <BulkActionBar
              selectedCount={selected.length}
              onClear={() => setSelected([])}
              itemLabel="investor"
              actions={
                <>
                  <Button size="sm" variant="outline">
                    Reassign RM
                  </Button>
                  <Button size="sm" variant="outline">
                    Export selection
                  </Button>
                  <Button size="sm" variant="destructive">
                    Suspend
                  </Button>
                </>
              }
            />
          </div>
        </Section>

        {/* StepForm */}
        <Section title="StepForm" description="Headless multi-step workflow with status states (complete / current / error / pending) and draft save.">
          <StepForm
            steps={steps}
            currentStepId={stepId}
            onStepChange={setStepId}
            onBack={() => setStepId(steps[Math.max(0, currentIdx - 1)].id)}
            onNext={() => setStepId(steps[Math.min(steps.length - 1, currentIdx + 1)].id)}
            onSaveDraft={() => toast.success("Draft saved")}
            onSubmit={() => toast.success("Submitted for approval")}
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {currentIdx + 1} of {steps.length}
              </p>
              <h3 className="text-lg font-semibold">{steps[currentIdx].label}</h3>
              <p className="text-sm text-muted-foreground">
                Plug any form, schema, or content here. The stepper, navigation, validation states, and draft save
                button are handled for you.
              </p>
            </div>
          </StepForm>
        </Section>

        {/* Timeline + AuditTrail */}
        <Section title="Timeline + AuditTrail" description="For order lifecycle, KYC progress, and admin audit logs with before/after diffs.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-semibold">Order lifecycle</h4>
              <Timeline items={SHOWCASE_TIMELINE} />
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Audit trail</h4>
              <AuditTrail entries={SHOWCASE_AUDIT} />
            </div>
          </div>
        </Section>

        {/* RelationshipCard */}
        <Section title="RelationshipCard" description="For investors, RMs, distributors, and family-group members.">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <RelationshipCard
              name="Anil Kumar"
              role="Primary investor"
              relation="Self"
              meta={[
                { label: "PAN", value: "ABCDE1234F" },
                { label: "RM", value: "Priya Sharma" },
                { label: "AUM", value: "₹42.5 L" },
                { label: "Folios", value: "7" },
              ]}
              actions={
                <>
                  <Button size="sm" variant="outline">View</Button>
                  <Button size="sm" variant="ghost">Unlink</Button>
                </>
              }
            />
            <RelationshipCard
              name="Priya Sharma"
              role="RM · Mumbai Andheri"
              relation="Assigned"
              meta={[
                { label: "Employee", value: "RM01284" },
                { label: "Clients", value: "62" },
                { label: "Branch", value: "Andheri W" },
                { label: "Joined", value: "Jan 2023" },
              ]}
            />
            <RelationshipCard
              name="Wealth First Advisors"
              role="Distributor"
              relation="ARN-12345"
              meta={[
                { label: "EUIN", value: "E123456" },
                { label: "Investors", value: "184" },
                { label: "AUM", value: "₹62 Cr" },
                { label: "Category", value: "Gold" },
              ]}
            />
          </div>
        </Section>

        {/* TabbedDetailLayout */}
        <Section title="TabbedDetailLayout" description="Shared shell for Investor, Scheme, and Execution detail pages.">
          <TabbedDetailLayout
            header={
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Investor</p>
                  <h3 className="mt-0.5 text-xl font-semibold">Anil Kumar</h3>
                  <p className="text-xs text-muted-foreground">PAN ABCDE1234F · Onboarded 14 Aug 2024</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="success" label="KYC verified" />
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </div>
            }
            tabs={[
              { id: "overview", label: "Overview", content: <div className="text-sm text-muted-foreground">Holdings summary, allocation, and recent activity.</div> },
              { id: "kyc", label: "KYC & FATCA", badge: "OK", content: <div className="text-sm text-muted-foreground">KYC verification details and FATCA declaration.</div> },
              { id: "bank", label: "Bank Accounts", badge: 2, content: <div className="text-sm text-muted-foreground">Linked bank accounts and primary debit account.</div> },
              { id: "nominees", label: "Nominees", badge: 3, content: <div className="text-sm text-muted-foreground">Nominee details and allocation percentages.</div> },
              { id: "audit", label: "Audit", content: <AuditTrail entries={SHOWCASE_AUDIT} /> },
            ]}
          />
        </Section>

        {/* UploadZone */}
        <Section title="UploadZone" description="Drag-drop file upload with per-file progress, size labels, and remove actions.">
          <UploadZone
            accept=".csv,.xlsx,.json"
            maxSizeMb={25}
            files={files}
            onFilesAdded={(added) => {
              setFiles((prev) => [
                ...prev,
                ...added.map((f, i) => ({
                  id: `${Date.now()}-${i}`,
                  name: f.name,
                  size: f.size,
                  progress: 0,
                  status: "queued" as const,
                })),
              ]);
            }}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          />
        </Section>

        {/* InfoDrawer + ConfirmationDialog triggers */}
        <Section title="InfoDrawer + ConfirmationDialog" description="Right-side detail drawer and destructive confirmation dialog.">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              Open InfoDrawer
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Open ConfirmationDialog
            </Button>
          </div>
        </Section>

        {/* Empty + Error */}
        <Section title="EmptyState + ErrorState" description="Consistent zero-data and failure surfaces.">
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState
              icon={Banknote}
              title="No payouts in this cycle"
              description="Distributor payouts will appear once brokerage import for Apr 2026 is processed."
              action={<Button size="sm">Import brokerage</Button>}
              secondaryAction={<Button size="sm" variant="ghost">View past cycles</Button>}
            />
            <ErrorState
              title="Couldn't load reconciliation feed"
              description="CAMS endpoint returned 503. Retrying in 2 min, or trigger manually."
              onRetry={() => toast.success("Retrying…")}
              action={<Button size="sm" variant="ghost">Open logs</Button>}
            />
          </div>
        </Section>
      </div>

      <InfoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Anil Kumar"
        description="PAN ABCDE1234F · Verified · Onboarded 14 Aug 2024"
        sections={[
          {
            id: "summary",
            title: "Summary",
            content: (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">AUM</p>
                  <p className="font-semibold">₹42.50 L</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Folios</p>
                  <p className="font-semibold">7</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RM</p>
                  <p className="font-semibold">Priya Sharma</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className="font-semibold">Aggressive</p>
                </div>
              </div>
            ),
          },
          {
            id: "activity",
            title: "Recent activity",
            content: <Timeline items={SHOWCASE_TIMELINE.slice(0, 3)} />,
          },
        ]}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
            <Button>Open full profile</Button>
          </div>
        }
      />

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive
        title="Suspend selected investors?"
        description="They won't be able to place new orders until reinstated. SIPs will continue."
        confirmLabel="Suspend"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          toast.success("Investors suspended");
          setSelected([]);
        }}
      />
    </>
  );
}
