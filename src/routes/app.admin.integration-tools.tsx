import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, Wrench, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/admin/integration-tools")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Integration tools — Admin" }] }),
  component: AdminIntegrationToolsPage,
});

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const panSchema = z.object({
  pan: z.string().trim().toUpperCase().regex(PAN_REGEX, "Invalid PAN format (e.g. ABCDE1234F)"),
});
const kycSchema = z.object({
  pan: z.string().trim().toUpperCase().regex(PAN_REGEX, "Invalid PAN format"),
  source: z.enum(["kra", "ckyc"]),
});

type PanResult = {
  status: "verified" | "failed" | "pending";
  pan: string;
  nameOnPan?: string;
  kycStatus?: string;
  registrar?: string;
  lastVerifiedAt?: string;
  message?: string;
};

interface DiagnosticRow {
  id: string;
  pan: string;
  tool: "BSE PAN" | "NDML KRA" | "CKYC";
  result: "verified" | "failed" | "pending";
  by: string;
  at: string;
}

const RESULT_TONE: Record<DiagnosticRow["result"], StatusTone> = {
  verified: "success",
  failed: "destructive",
  pending: "warning",
};

const HISTORY: DiagnosticRow[] = [
  { id: "d1", pan: "ABCDE****F", tool: "BSE PAN", result: "verified", by: "ops@buybestfin", at: "2026-04-15T10:30:00Z" },
  { id: "d2", pan: "PQRSX****L", tool: "NDML KRA", result: "verified", by: "ops@buybestfin", at: "2026-04-15T09:12:00Z" },
  { id: "d3", pan: "BCDEF****Z", tool: "CKYC", result: "pending", by: "rm.delhi@buybestfin", at: "2026-04-14T17:55:00Z" },
  { id: "d4", pan: "XYABE****P", tool: "BSE PAN", result: "failed", by: "ops@buybestfin", at: "2026-04-14T15:20:00Z" },
  { id: "d5", pan: "MNQAS****R", tool: "NDML KRA", result: "verified", by: "rm.bom@buybestfin", at: "2026-04-13T11:08:00Z" },
];

function maskPan(pan: string): string {
  if (pan.length !== 10) return pan;
  return `${pan.slice(0, 5)}****${pan.slice(9)}`;
}

function mockBseCheck(pan: string): PanResult {
  const last = pan.charCodeAt(9);
  if (last % 5 === 0) return { status: "failed", pan, message: "PAN not registered with BSE Star MF" };
  return {
    status: "verified",
    pan,
    nameOnPan: "Aarav Mehta",
    kycStatus: "KYC Verified",
    lastVerifiedAt: new Date().toISOString(),
  };
}

function mockKycCheck(pan: string, source: "kra" | "ckyc"): PanResult {
  const last = pan.charCodeAt(9);
  if (last % 7 === 0) return { status: "failed", pan, message: `${source.toUpperCase()} returned no record` };
  if (last % 4 === 0) return { status: "pending", pan, message: "KYC under review" };
  return {
    status: "verified",
    pan,
    nameOnPan: "Saanvi Iyer",
    kycStatus: source === "kra" ? "KRA Verified" : "CKYC Compliant",
    registrar: source === "kra" ? "NDML KRA" : "CERSAI",
    lastVerifiedAt: new Date().toISOString(),
  };
}

export default function AdminIntegrationToolsPage() {
  const [bseResult, setBseResult] = useState<PanResult | null>(null);
  const [kycResult, setKycResult] = useState<PanResult | null>(null);

  const bseForm = useForm<z.infer<typeof panSchema>>({ resolver: zodResolver(panSchema), defaultValues: { pan: "" } });
  const kycForm = useForm<z.infer<typeof kycSchema>>({ resolver: zodResolver(kycSchema), defaultValues: { pan: "", source: "kra" } });

  const columns: DataTableColumn<DiagnosticRow>[] = [
    { id: "pan", header: "PAN", sortValue: (r) => r.pan, accessor: (r) => <span className="font-mono text-sm">{r.pan}</span> },
    { id: "tool", header: "Tool", sortValue: (r) => r.tool, accessor: (r) => r.tool },
    { id: "result", header: "Result", sortValue: (r) => r.result, accessor: (r) => <StatusBadge tone={RESULT_TONE[r.result]} label={r.result} /> },
    { id: "by", header: "Run by", sortValue: (r) => r.by, accessor: (r) => <span className="text-muted-foreground text-sm">{r.by}</span> },
    { id: "at", header: "When", sortValue: (r) => r.at, accessor: (r) => <span className="text-muted-foreground text-sm">{formatDate(r.at)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · System"
        title="Integration tools & diagnostics"
        description="Run on-demand checks against BSE Star MF and NDML KYC. Results are logged for audit."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>BSE PAN check</CardTitle>
                  <CardDescription>Verify a PAN with BSE Star MF (BSEPanCheckToolView).</CardDescription>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={bseForm.handleSubmit((v) => {
                  const res = mockBseCheck(v.pan);
                  setBseResult(res);
                  if (res.status === "verified") toast.success(`PAN ${v.pan} verified`);
                  else toast.error(res.message ?? "Check failed");
                })}
              >
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input placeholder="ABCDE1234F" maxLength={10} className="uppercase font-mono" {...bseForm.register("pan")} />
                  {bseForm.formState.errors.pan && <p className="text-xs text-destructive">{bseForm.formState.errors.pan.message}</p>}
                </div>
                <Button type="submit" className="gap-2"><ShieldCheck className="h-4 w-4" /> Run BSE check</Button>
                {bseResult && <ResultPanel result={bseResult} />}
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>NDML KYC / CKYC status</CardTitle>
                  <CardDescription>Lookup KRA or CKYC registration (CheckPANStatusView).</CardDescription>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={kycForm.handleSubmit((v) => {
                  const res = mockKycCheck(v.pan, v.source);
                  setKycResult(res);
                  if (res.status === "verified") toast.success(`KYC verified for ${v.pan}`);
                  else if (res.status === "pending") toast.message(res.message ?? "Pending");
                  else toast.error(res.message ?? "Check failed");
                })}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>PAN</Label>
                    <Input placeholder="ABCDE1234F" maxLength={10} className="uppercase font-mono" {...kycForm.register("pan")} />
                    {kycForm.formState.errors.pan && <p className="text-xs text-destructive">{kycForm.formState.errors.pan.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={kycForm.watch("source")} onValueChange={(v) => kycForm.setValue("source", v as "kra" | "ckyc")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kra">NDML KRA</SelectItem>
                        <SelectItem value="ckyc">CKYC (CERSAI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="gap-2"><ShieldCheck className="h-4 w-4" /> Run KYC check</Button>
                {kycResult && <ResultPanel result={kycResult} />}
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent diagnostics</CardTitle>
            <CardDescription>Latest 10 PAN/KYC lookups across the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={HISTORY} initialSortId="at" pageSize={10} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ResultPanel({ result }: { result: PanResult }) {
  const Icon = result.status === "verified" ? CheckCircle2 : result.status === "failed" ? XCircle : ShieldCheck;
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        result.status === "verified" && "border-success/30 bg-success/10",
        result.status === "failed" && "border-destructive/30 bg-destructive/10",
        result.status === "pending" && "border-warning/30 bg-warning/10",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            result.status === "verified" && "text-success",
            result.status === "failed" && "text-destructive",
            result.status === "pending" && "text-warning",
          )}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">
            {result.status === "verified" ? "Verified" : result.status === "failed" ? "Failed" : "Pending"} · <span className="font-mono">{maskPan(result.pan)}</span>
          </p>
          {result.nameOnPan && <p className="text-sm text-muted-foreground">Name on PAN: {result.nameOnPan}</p>}
          {result.kycStatus && <p className="text-sm text-muted-foreground">KYC: {result.kycStatus}</p>}
          {result.registrar && <p className="text-sm text-muted-foreground">Registrar: {result.registrar}</p>}
          {result.lastVerifiedAt && <p className="text-xs text-muted-foreground">Checked {formatDate(result.lastVerifiedAt)}</p>}
          {result.message && <p className="text-sm">{result.message}</p>}
        </div>
      </div>
    </div>
  );
}
