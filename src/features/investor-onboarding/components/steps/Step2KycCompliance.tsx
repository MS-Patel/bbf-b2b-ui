import { RefreshCw, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Timeline } from "@/components/admin/timeline";
import { SectionCard } from "../SectionCard";
import { ValidationBanner } from "../ValidationBanner";
import type { KycData, KycStatus } from "../../types";

const TONE_MAP: Record<KycStatus, StatusTone> = {
  pending: "warning",
  verified: "success",
  rejected: "destructive",
  expired: "destructive",
};

const ICON_MAP: Record<KycStatus, typeof ShieldCheck> = {
  pending: ShieldQuestion,
  verified: ShieldCheck,
  rejected: ShieldX,
  expired: ShieldAlert,
};

export interface Step2Props {
  value: KycData;
  onChange: (next: KycData) => void;
}

export function Step2KycCompliance({ value, onChange }: Step2Props) {
  const Icon = ICON_MAP[value.status];
  const triggerRecheck = () => {
    const now = new Date().toISOString();
    onChange({
      ...value,
      status: "verified",
      referenceId: value.referenceId ?? `NDML-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      lastCheckedAt: now,
      events: [
        { id: `evt_${Date.now()}`, at: now, label: "NDML re-verification completed", tone: "success", note: "All identifiers matched" },
        ...value.events,
      ],
    });
  };

  return (
    <div className="space-y-5">
      {value.status === "rejected" && (
        <ValidationBanner
          tone="error"
          title="KYC was rejected"
          description={value.rejectionReason ?? "Provider returned rejection. Investor must re-submit documents before onboarding can continue."}
        />
      )}
      {value.status === "expired" && (
        <ValidationBanner tone="warning" title="KYC has expired" description="Re-trigger verification with the registered KRA provider." />
      )}

      <section className="overflow-hidden rounded-xl border-2 border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-surface px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">KRA Verification</p>
              <h3 className="text-base font-semibold">{value.provider} KYC check</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ref · <span className="font-mono">{value.referenceId ?? "—"}</span>
                {value.lastCheckedAt && <> · Last checked {new Date(value.lastCheckedAt).toLocaleString()}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone={TONE_MAP[value.status]} label={value.status.toUpperCase()} />
            <Button type="button" variant="outline" size="sm" onClick={triggerRecheck}>
              <RefreshCw className="h-4 w-4" /> Re-run verification
            </Button>
          </div>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">KRA Provider</Label>
            <Select value={value.provider} onValueChange={(v) => onChange({ ...value, provider: v as KycData["provider"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NDML">NDML</SelectItem>
                <SelectItem value="CVL">CVL KRA</SelectItem>
                <SelectItem value="CAMS">CAMS KRA</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Verification status is sourced from the central KRA. Status changes propagate to all dependent workflows (orders, mandates, payouts).
            </div>
            <label className="flex cursor-pointer items-start gap-2 pt-2 text-sm">
              <Checkbox checked={value.consentAck} onCheckedChange={(c) => onChange({ ...value, consentAck: !!c })} className="mt-0.5" />
              <span className="text-foreground">
                Investor consent obtained for KRA verification and data sharing
                <span className="block text-xs text-muted-foreground">Required before submission to compliance.</span>
              </span>
            </label>
          </div>

          <div>
            <Label className="mb-3 block text-[11px] uppercase tracking-wider text-muted-foreground">Verification timeline</Label>
            <Timeline items={value.events.map((e) => ({ id: e.id, title: e.label, meta: new Date(e.at).toLocaleString(), body: e.note, tone: e.tone }))} />
          </div>
        </div>
      </section>

      <SectionCard title="Compliance flags" description="These flags will be cross-checked at submission.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Aadhaar seeded", ok: value.status === "verified" },
            { label: "Mobile verified", ok: true },
            { label: "Email verified", ok: false },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5">
              <span className="text-sm">{f.label}</span>
              <StatusBadge tone={f.ok ? "success" : "warning"} label={f.ok ? "OK" : "Pending"} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
