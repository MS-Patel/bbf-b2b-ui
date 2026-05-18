import { useMemo } from "react";
import { CheckCircle2, FileCheck, ListChecks, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { KPIWidget } from "@/components/admin/kpi-widget";
import { SectionCard } from "../SectionCard";
import { ReviewSectionCard, type ReviewField } from "../ReviewSectionCard";
import { ValidationBanner } from "../ValidationBanner";
import type { ConsentState, OnboardingDraft, StepKey } from "../../types";
import { ONBOARDING_STEPS } from "../../constants";
import { MOCK_BRANCHES, MOCK_DISTRIBUTORS, MOCK_RMS } from "../../fixtures";

export interface Step9Props {
  draft: OnboardingDraft;
  onJump: (key: StepKey) => void;
  consent: ConsentState;
  onConsentChange: (next: ConsentState) => void;
  blockingIssues: string[];
}

function buildReviewSections(draft: OnboardingDraft): Array<{ key: StepKey; title: string; fields: ReviewField[]; errorCount: number; status: "complete" | "incomplete" | "warning" }> {
  const id = draft.identity;
  const k = draft.kyc;
  const f = draft.fatca;
  const banks = draft.banks;
  const noms = draft.nominees;
  const risk = draft.risk;
  const rel = draft.relationship;
  const docs = draft.documents;

  const identityFields: ReviewField[] = [
    { label: "PAN", value: id.pan, status: id.panLookupStatus === "verified" ? "ok" : id.pan ? "warning" : "missing" },
    { label: "Investor type", value: id.investorType },
    { label: "Full name", value: id.fullName, status: id.fullName ? "ok" : "missing" },
    { label: "Mobile", value: id.mobile, status: id.mobile ? "ok" : "missing" },
    { label: "Email", value: id.email, status: id.email ? "ok" : "missing" },
    { label: "Holding type", value: id.holdingType },
  ];
  const identityErrors = identityFields.filter((x) => x.status === "missing").length + (id.panLookupStatus === "duplicate" ? 1 : 0);

  const kycFields: ReviewField[] = [
    { label: "Provider", value: k.provider },
    { label: "Status", value: k.status, status: k.status === "verified" ? "ok" : "warning" },
    { label: "Reference", value: k.referenceId ?? "—", status: k.referenceId ? "ok" : "missing" },
    { label: "Consent", value: k.consentAck ? "Captured" : "Missing", status: k.consentAck ? "ok" : "missing" },
  ];
  const kycErrors = kycFields.filter((x) => x.status === "missing").length + (k.status !== "verified" ? 1 : 0);

  const fatcaFields: ReviewField[] = [
    { label: "Residencies", value: `${f.residencies.length}`, status: f.residencies.length > 0 ? "ok" : "missing" },
    { label: "Classification", value: f.classification },
    { label: "US person", value: f.usPerson ? "Yes" : "No", status: f.usPerson ? "warning" : "ok" },
    { label: "Declaration", value: f.declarationAck ? "Signed" : "Missing", status: f.declarationAck ? "ok" : "missing" },
  ];
  const fatcaErrors = fatcaFields.filter((x) => x.status === "missing").length;

  const primary = banks.find((b) => b.primary && b.active);
  const bankFields: ReviewField[] = [
    { label: "Accounts", value: `${banks.length}`, status: banks.length > 0 ? "ok" : "missing" },
    { label: "Primary", value: primary ? `${primary.bankName} ••••${primary.accountNumber.slice(-4)}` : "Not set", status: primary ? "ok" : "missing" },
    { label: "Verified", value: `${banks.filter((b) => b.verifyStatus === "verified").length} / ${banks.length}` },
  ];
  const bankErrors = bankFields.filter((x) => x.status === "missing").length;

  const nomTotal = noms.reduce((s, n) => s + (Number(n.sharePct) || 0), 0);
  const nomineeFields: ReviewField[] = [
    { label: "Nominees", value: `${noms.length}` },
    { label: "Allocation total", value: `${nomTotal}%`, status: noms.length === 0 ? "warning" : nomTotal === 100 ? "ok" : "missing" },
  ];
  const nomineeErrors = noms.length > 0 && nomTotal !== 100 ? 1 : 0;

  const riskLevel = risk.overrideLevel ?? risk.computedLevel;
  const riskFields: ReviewField[] = [
    { label: "Profile", value: riskLevel ?? "—", status: riskLevel ? "ok" : "missing" },
    { label: "Override", value: risk.overrideLevel ? "Yes" : "No", status: risk.overrideLevel ? "warning" : "ok" },
  ];
  const riskErrors = riskFields.filter((x) => x.status === "missing").length;

  const rmName = MOCK_RMS.find((r) => r.id === rel.rmId)?.name;
  const distName = MOCK_DISTRIBUTORS.find((d) => d.id === rel.distributorId)?.name;
  const branchName = MOCK_BRANCHES.find((b) => b.id === rel.branchId || b.id === MOCK_RMS.find((r) => r.id === rel.rmId)?.branchId)?.name;
  const relFields: ReviewField[] = [
    { label: "RM", value: rmName ?? "—", status: rmName ? "ok" : "missing" },
    { label: "Distributor", value: distName ?? "—", status: distName ? "ok" : "missing" },
    { label: "Branch", value: branchName ?? "—" },
  ];
  const relErrors = relFields.filter((x) => x.status === "missing").length;

  const requiredDocs = docs.filter((d) => d.required);
  const docFields: ReviewField[] = requiredDocs.map((d) => ({
    label: d.label,
    value: d.status === "verified" ? "Verified" : d.status === "missing" ? "Missing" : d.status,
    status: d.status === "verified" ? "ok" : d.status === "missing" ? "missing" : "warning",
  }));
  const docErrors = requiredDocs.filter((d) => d.status !== "verified").length;

  const out: Array<{ key: StepKey; title: string; fields: ReviewField[]; errorCount: number; status: "complete" | "incomplete" | "warning" }> = [
    { key: "identity", title: "Identity", fields: identityFields, errorCount: identityErrors, status: identityErrors === 0 ? "complete" : "incomplete" },
    { key: "kyc", title: "KYC & Compliance", fields: kycFields, errorCount: kycErrors, status: kycErrors === 0 ? "complete" : "incomplete" },
    { key: "fatca", title: "FATCA & Taxation", fields: fatcaFields, errorCount: fatcaErrors, status: fatcaErrors === 0 ? (f.usPerson ? "warning" : "complete") : "incomplete" },
    { key: "bank", title: "Bank Accounts", fields: bankFields, errorCount: bankErrors, status: bankErrors === 0 ? "complete" : "incomplete" },
    { key: "nominees", title: "Nominees", fields: nomineeFields, errorCount: nomineeErrors, status: noms.length === 0 ? "warning" : nomineeErrors === 0 ? "complete" : "incomplete" },
    { key: "risk", title: "Risk Profile", fields: riskFields, errorCount: riskErrors, status: riskErrors === 0 ? "complete" : "incomplete" },
    { key: "relationship", title: "Relationship Mapping", fields: relFields, errorCount: relErrors, status: relErrors === 0 ? "complete" : "incomplete" },
    { key: "documents", title: "Documents", fields: docFields, errorCount: docErrors, status: docErrors === 0 ? "complete" : "incomplete" },
  ];
  return out;
}

export function Step9ReviewSubmit({ draft, onJump, consent, onConsentChange, blockingIssues }: Step9Props) {
  const sections = useMemo(() => buildReviewSections(draft), [draft]);
  const totalSections = sections.length;
  const complete = sections.filter((s) => s.status === "complete").length;
  const issues = sections.reduce((s, x) => s + x.errorCount, 0);
  const docsVerified = draft.documents.filter((d) => d.required && d.status === "verified").length;
  const docsRequired = draft.documents.filter((d) => d.required).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <KPIWidget icon={CheckCircle2} label="Sections complete" value={`${complete} / ${totalSections}`} hint={`${Math.round((complete / totalSections) * 100)}%`} />
        <KPIWidget icon={AlertTriangle} label="Validation issues" value={issues} delta={{ value: issues === 0 ? "All clear" : "Blocking", direction: "flat", tone: issues === 0 ? "positive" : "negative" }} />
        <KPIWidget icon={FileCheck} label="Documents verified" value={`${docsVerified} / ${docsRequired}`} />
      </div>

      {blockingIssues.length > 0 && (
        <ValidationBanner tone="error" title="Resolve blocking issues before submission" items={blockingIssues} />
      )}

      <SectionCard title="Section-by-section review" description="Expand any section to verify field-level values. Click 'Jump to section' to edit." aside={<ListChecks className="h-4 w-4 text-muted-foreground" />}>
        <div className="space-y-2">
          {sections.map((s) => (
            <ReviewSectionCard
              key={s.key}
              title={`${ONBOARDING_STEPS.find((x) => x.key === s.key)?.index}. ${s.title}`}
              status={s.status}
              fields={s.fields}
              errorCount={s.errorCount}
              onJump={() => onJump(s.key)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Declarations & consent" description="All consents are audited and timestamped at submission.">
        <div className="space-y-2.5">
          {[
            { key: "termsAck" as const, label: "I confirm the investor has read and accepted the Terms of Service and Risk Disclosures." },
            { key: "dataProcessingAck" as const, label: "Investor consents to data processing per Privacy Policy and DPDP Act requirements." },
            { key: "declarationAck" as const, label: "All declarations and uploaded documents are true and complete to the best of my knowledge." },
            { key: "marketingOptIn" as const, label: "Investor opts in to product updates and research communications (optional)." },
          ].map((row) => (
            <label key={row.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">
              <Checkbox checked={consent[row.key]} onCheckedChange={(c) => onConsentChange({ ...consent, [row.key]: !!c })} className="mt-0.5" />
              <span>{row.label}</span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
