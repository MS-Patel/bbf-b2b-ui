import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Download, Edit, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  TabbedDetailLayout,
  type TabbedDetailTab,
  StatusBadge,
  type StatusTone,
  RelationshipCard,
  AuditTrail,
  type AuditEntry,
  DataTable,
  type DataTableColumn,
  EmptyState,
  KPIWidget,
} from "@/components/admin";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useInvestorQuery } from "@/features/investors/api";
import type {
  Investor,
  InvestorDocument,
  InvestorNominee,
  InvestorSIP,
  InvestorStatus,
  InvestorTxnLite,
} from "@/features/investors/types";
import type { KycStatusLite } from "@/types/admin";
import { formatCompactINR, formatDate, formatINR } from "@/lib/format";

export const Route = createFileRoute("/app/admin/investors/$investorId")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Investor — Admin" }] }),
  component: InvestorDetailPage,
});

const STATUS_TONE: Record<InvestorStatus, StatusTone> = {
  active: "success",
  onboarding: "info",
  dormant: "muted",
  suspended: "destructive",
};

const KYC_TONE: Record<KycStatusLite, StatusTone> = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
  not_started: "muted",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function InvestorDetailPage() {
  const { investorId } = Route.useParams();
  const navigate = useNavigate();
  const { data: investor, isLoading } = useInvestorQuery(investorId);

  if (isLoading) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">Loading investor profile…</div>
    );
  }
  if (!investor) {
    return (
      <div className="px-6 py-10">
        <EmptyState
          title="Investor not found"
          description="This folio may have been removed or you do not have access."
          action={
            <Button variant="outline" onClick={() => void navigate({ to: "/app/admin/investors" })}>
              Back to investors
            </Button>
          }
        />
      </div>
    );
  }

  const tabs: TabbedDetailTab[] = [
    { id: "overview", label: "Overview", content: <OverviewTab investor={investor} /> },
    { id: "kyc", label: "KYC / FATCA", content: <KycTab investor={investor} /> },
    { id: "bank", label: "Bank", badge: investor.banks.length, content: <BankTab investor={investor} /> },
    { id: "nominees", label: "Nominees", badge: investor.nominees.length, content: <NomineesTab investor={investor} /> },
    { id: "documents", label: "Documents", badge: investor.documents.length, content: <DocumentsTab investor={investor} /> },
    { id: "relationships", label: "Relationships", badge: investor.relationships.length, content: <RelationshipsTab investor={investor} /> },
    { id: "risk", label: "Risk", content: <RiskTab investor={investor} /> },
    { id: "transactions", label: "Transactions", badge: investor.transactions.length, content: <TransactionsTab investor={investor} /> },
    { id: "sip", label: "SIP", badge: investor.sips.length, content: <SipTab investor={investor} /> },
    { id: "family", label: "Family", content: <FamilyTab investor={investor} /> },
    { id: "audit", label: "Audit", badge: investor.audit.length, content: <AuditTab investor={investor} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/app/admin/investors" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Admin · Investors
          </Link>
        }
        title={investor.fullName}
        description={`PAN ${investor.pan} · Folio ${investor.folioNo}`}
        actions={
          <>
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Statement</Button>
            <Button variant="outline" className="gap-2"><Edit className="h-4 w-4" /> Edit</Button>
          </>
        }
      />
      <div className="px-6 py-6 sm:px-8">
        <TabbedDetailLayout
          header={<InvestorHeader investor={investor} />}
          tabs={tabs}
          defaultTab="overview"
        />
      </div>
    </>
  );
}

/* ---------------- Header ---------------- */

function InvestorHeader({ investor }: { investor: Investor }) {
  return (
    <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
            {initials(investor.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold">{investor.fullName}</h2>
            <StatusBadge tone={STATUS_TONE[investor.status]} label={investor.status} />
            <StatusBadge tone={KYC_TONE[investor.kycStatus]} label={`KYC ${investor.kycStatus.replace("_", " ")}`} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> {investor.email}</span>
            <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" /> {investor.phoneMasked}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {investor.city}, {investor.state}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Joined {formatDate(investor.joinedAt)}</span>
          </div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 border-t border-border/60 pt-4 lg:ml-auto lg:max-w-md lg:grid-cols-3 lg:border-0 lg:pt-0">
        <Stat label="AUM" value={formatCompactINR(investor.aum)} />
        <Stat label="SIP" value={investor.sipMonthly > 0 ? formatINR(investor.sipMonthly) : "—"} />
        <Stat label="Risk" value={investor.riskProfile} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}

/* ---------------- Tabs ---------------- */

function OverviewTab({ investor }: { investor: Investor }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <KPIWidget label="AUM" value={formatCompactINR(investor.aum)} delta={{ value: "+1.8%", direction: "up" }} />
          <KPIWidget label="Active SIPs" value={investor.sips.filter((s) => s.status === "active").length} hint={`${formatINR(investor.sipMonthly)}/mo`} />
          <KPIWidget label="Last order" value={formatDate(investor.lastOrderAt)} hint={`${investor.transactions.length} in 6 months`} />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-sm">Compliance snapshot</CardTitle></CardHeader>
          <CardContent>
            <ComplianceGrid investor={investor} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Identity</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <KV label="PAN" value={investor.pan} />
          <KV label="Folio" value={investor.folioNo} />
          <KV label="Date of birth" value={formatDate(investor.dob)} />
          <Separator />
          <KV label="RM" value={investor.rmName} />
          <KV label="Distributor" value={investor.distributorName} />
          <KV label="Family group" value={investor.familyGroup ?? "—"} />
          <Separator />
          <KV label="Address" value={investor.address} />
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceGrid({ investor }: { investor: Investor }) {
  const items = [
    { label: "KYC", value: investor.kycStatus.replace("_", " "), tone: KYC_TONE[investor.kycStatus] },
    { label: "FATCA", value: investor.fatca, tone: (investor.fatca === "declared" ? "success" : investor.fatca === "pending" ? "warning" : "info") as StatusTone },
    { label: "Nominee", value: investor.nomineeStatus, tone: (investor.nomineeStatus === "registered" ? "success" : investor.nomineeStatus === "missing" ? "warning" : "destructive") as StatusTone },
    { label: "Bank", value: investor.banks.length > 0 ? "verified" : "missing", tone: (investor.banks.length > 0 ? "success" : "warning") as StatusTone },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{i.label}</p>
          <div className="mt-2"><StatusBadge tone={i.tone} label={i.value} /></div>
        </div>
      ))}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

function KycTab({ investor }: { investor: Investor }) {
  const checks = [
    { k: "Identity (PAN)", ok: true, note: investor.pan },
    { k: "Address proof", ok: investor.kycStatus === "verified" },
    { k: "FATCA declaration", ok: investor.fatca === "declared", note: investor.fatca },
    { k: "In-person verification", ok: investor.kycStatus === "verified" },
    { k: "Risk assessment", ok: true, note: investor.riskProfile },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">KYC checklist</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {checks.map((c) => (
            <div key={c.k} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}
                <span>{c.k}</span>
              </div>
              {c.note && <span className="text-xs text-muted-foreground">{c.note}</span>}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">FATCA / regulatory</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <KV label="FATCA status" value={investor.fatca} />
          <KV label="Tax residence" value="India" />
          <KV label="PEP" value="No" />
          <KV label="Last review" value={formatDate(investor.audit[1]?.at ?? investor.joinedAt)} />
          <div className="pt-2"><Button size="sm" variant="outline">Re-trigger KYC</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function BankTab({ investor }: { investor: Investor }) {
  if (investor.banks.length === 0) {
    return <EmptyState title="No bank accounts" description="Add a bank account to enable redemptions." />;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {investor.banks.map((b, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{b.bankName}</p>
              {b.primary && <Badge variant="secondary">Primary</Badge>}
            </div>
            <KV label="Account" value={b.accountMasked} />
            <KV label="IFSC" value={b.ifsc} />
            {b.verifiedAt && <KV label="Verified" value={formatDate(b.verifiedAt)} />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NomineesTab({ investor }: { investor: Investor }) {
  if (investor.nominees.length === 0) {
    return (
      <EmptyState
        title="No nominees registered"
        description="Nominees are required for new investments. Add one to keep the folio compliant."
        action={<Button size="sm">Add nominee</Button>}
      />
    );
  }
  const columns: DataTableColumn<InvestorNominee>[] = [
    { id: "name", header: "Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { id: "rel", header: "Relation", accessor: (r) => r.relation, sortValue: (r) => r.relation },
    { id: "dob", header: "DOB", accessor: (r) => (r.dob ? formatDate(r.dob) : "—") },
    { id: "share", header: "Share", align: "right", sortValue: (r) => r.sharePct, accessor: (r) => `${r.sharePct}%` },
  ];
  return <DataTable columns={columns} data={investor.nominees} pageSize={10} />;
}

function DocumentsTab({ investor }: { investor: Investor }) {
  const DOC_TONE: Record<InvestorDocument["status"], StatusTone> = {
    verified: "success", pending: "warning", rejected: "destructive",
  };
  const columns: DataTableColumn<InvestorDocument>[] = [
    { id: "type", header: "Type", accessor: (r) => <span className="font-medium">{r.type}</span>, sortValue: (r) => r.type },
    { id: "file", header: "File", accessor: (r) => <span className="text-muted-foreground">{r.fileName}</span> },
    { id: "uploaded", header: "Uploaded", sortValue: (r) => r.uploadedAt, accessor: (r) => formatDate(r.uploadedAt) },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={DOC_TONE[r.status]} label={r.status} /> },
  ];
  return (
    <DataTable
      columns={columns}
      data={investor.documents}
      pageSize={10}
      rowActions={() => <Button variant="ghost" size="sm">View</Button>}
    />
  );
}

function RelationshipsTab({ investor }: { investor: Investor }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {investor.relationships.map((r) => (
        <RelationshipCard
          key={r.id}
          name={r.name}
          role={r.role}
          relation={r.role}
          meta={[
            ...(r.meta ? [{ label: "Detail", value: r.meta }] : []),
            ...(r.since ? [{ label: "Since", value: formatDate(r.since) }] : []),
          ]}
          actions={<Button size="sm" variant="outline">View</Button>}
        />
      ))}
    </div>
  );
}

function RiskTab({ investor }: { investor: Investor }) {
  const score = investor.riskProfile === "Aggressive" ? 82 : investor.riskProfile === "Moderate" ? 56 : 28;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-sm">Risk profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-3xl font-bold">{investor.riskProfile}</p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Score: {score}/100 · Reviewed {formatDate(investor.audit[0]?.at ?? investor.joinedAt)}</p>
          <Button size="sm" variant="outline">Re-assess risk</Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-sm">Suitability flags</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {investor.riskProfile === "Conservative" && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
              <p>Equity exposure above 60% — review with investor.</p>
            </div>
          )}
          <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
            <p>Portfolio diversification within target range.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsTab({ investor }: { investor: Investor }) {
  const TONE: Record<InvestorTxnLite["status"], StatusTone> = {
    settled: "success", pending: "warning", failed: "destructive",
  };
  const columns: DataTableColumn<InvestorTxnLite>[] = [
    { id: "date", header: "Date", sortValue: (r) => r.date, accessor: (r) => formatDate(r.date) },
    { id: "scheme", header: "Scheme", accessor: (r) => <span className="truncate">{r.scheme}</span> },
    { id: "type", header: "Type", sortValue: (r) => r.type, accessor: (r) => <Badge variant="secondary">{r.type}</Badge> },
    { id: "amt", header: "Amount", align: "right", sortValue: (r) => r.amount, accessor: (r) => formatINR(r.amount) },
    { id: "units", header: "Units", align: "right", sortValue: (r) => r.units, accessor: (r) => r.units.toFixed(3) },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  ];
  return <DataTable columns={columns} data={investor.transactions} pageSize={10} initialSortId="date" initialSortDir="desc" />;
}

function SipTab({ investor }: { investor: Investor }) {
  if (investor.sips.length === 0) {
    return <EmptyState title="No active SIPs" description="This investor has no systematic plans set up." />;
  }
  const TONE: Record<InvestorSIP["status"], StatusTone> = {
    active: "success", paused: "warning", stopped: "muted",
  };
  const columns: DataTableColumn<InvestorSIP>[] = [
    { id: "scheme", header: "Scheme", accessor: (r) => <span className="font-medium">{r.scheme}</span> },
    { id: "amt", header: "Amount", align: "right", sortValue: (r) => r.amount, accessor: (r) => formatINR(r.amount) },
    { id: "freq", header: "Frequency", accessor: (r) => r.frequency },
    { id: "next", header: "Next debit", sortValue: (r) => r.nextDebit, accessor: (r) => formatDate(r.nextDebit) },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  ];
  return <DataTable columns={columns} data={investor.sips} pageSize={10} />;
}

function FamilyTab({ investor }: { investor: Investor }) {
  if (!investor.familyGroup) {
    return (
      <EmptyState
        title="Not in a family group"
        description="Group this folio with related investors to consolidate reporting."
        action={<Button size="sm" variant="outline">Add to family group</Button>}
      />
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{investor.familyGroup}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Consolidated family reporting groups multiple folios under a single household for AUM, P&L and capital gains views.</p>
        <p>3 linked members · Combined AUM ₹2.4 Cr</p>
      </CardContent>
    </Card>
  );
}

function AuditTab({ investor }: { investor: Investor }) {
  const entries: AuditEntry[] = investor.audit.map((a) => ({
    id: a.id,
    actor: a.actor,
    action: a.action,
    at: formatDate(a.at),
    tone: "info",
    before: a.field && a.before !== undefined ? { [a.field]: a.before } : undefined,
    after: a.field && a.after !== undefined ? { [a.field]: a.after } : undefined,
  }));
  return (
    <Card>
      <CardContent className="p-5">
        <AuditTrail entries={entries} />
      </CardContent>
    </Card>
  );
}
