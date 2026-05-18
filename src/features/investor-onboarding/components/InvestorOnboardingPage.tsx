import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowHeader } from "./WorkflowHeader";
import { WorkflowStepper } from "./WorkflowStepper";
import { WorkflowActionBar } from "./WorkflowActionBar";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { Step1Identity } from "./steps/Step1Identity";
import { Step2KycCompliance } from "./steps/Step2KycCompliance";
import { Step3FatcaTaxation } from "./steps/Step3FatcaTaxation";
import { Step4BankAccounts } from "./steps/Step4BankAccounts";
import { Step5Nominees } from "./steps/Step5Nominees";
import { Step6RiskProfile } from "./steps/Step6RiskProfile";
import { Step7RelationshipMapping } from "./steps/Step7RelationshipMapping";
import { Step8Documents } from "./steps/Step8Documents";
import { Step9ReviewSubmit } from "./steps/Step9ReviewSubmit";
import { ONBOARDING_STEPS } from "../constants";
import { createEmptyDraft } from "../fixtures";
import type { OnboardingDraft, StepKey, StepProgress, StepValidity } from "../types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function computeProgress(draft: OnboardingDraft): Record<StepKey, StepProgress> {
  const id = draft.identity;
  const idErrors = [
    !PAN_REGEX.test(id.pan),
    !id.fullName.trim(),
    !id.mobile.trim(),
    !id.email.trim(),
  ].filter(Boolean).length;
  const identity: StepProgress = { key: "identity", errorCount: idErrors, completeCount: 4 - idErrors, totalCount: 4, status: idErrors === 0 ? "complete" : "pending" };

  const k = draft.kyc;
  const kErrors = (k.status === "verified" ? 0 : 1) + (k.consentAck ? 0 : 1);
  const kyc: StepProgress = { key: "kyc", errorCount: kErrors, completeCount: 2 - kErrors, totalCount: 2, status: kErrors === 0 ? "complete" : "pending" };

  const f = draft.fatca;
  const fErrors = (f.residencies.length === 0 ? 1 : 0) + (f.declarationAck ? 0 : 1);
  const fatca: StepProgress = { key: "fatca", errorCount: fErrors, completeCount: 2 - fErrors, totalCount: 2, status: fErrors === 0 ? "complete" : "pending" };

  const banksErrors = draft.banks.length === 0 ? 1 : draft.banks.some((b) => b.primary && b.active) ? 0 : 1;
  const bank: StepProgress = { key: "bank", errorCount: banksErrors, completeCount: 1 - banksErrors, totalCount: 1, status: banksErrors === 0 ? "complete" : "pending" };

  const nomTotal = draft.nominees.reduce((s, n) => s + (Number(n.sharePct) || 0), 0);
  const nomErrors = draft.nominees.length > 0 && nomTotal !== 100 ? 1 : 0;
  const nominees: StepProgress = { key: "nominees", errorCount: nomErrors, completeCount: nomErrors === 0 ? 1 : 0, totalCount: 1, status: nomErrors === 0 ? "complete" : "pending" };

  const riskLevel = draft.risk.overrideLevel ?? draft.risk.computedLevel;
  const riskErrors = riskLevel ? 0 : 1;
  const risk: StepProgress = { key: "risk", errorCount: riskErrors, completeCount: 1 - riskErrors, totalCount: 1, status: riskErrors === 0 ? "complete" : "pending" };

  const relErrors = (draft.relationship.rmId ? 0 : 1) + (draft.relationship.distributorId ? 0 : 1);
  const relationship: StepProgress = { key: "relationship", errorCount: relErrors, completeCount: 2 - relErrors, totalCount: 2, status: relErrors === 0 ? "complete" : "pending" };

  const requiredDocs = draft.documents.filter((d) => d.required);
  const docVerified = requiredDocs.filter((d) => d.status === "verified").length;
  const docErrors = requiredDocs.length - docVerified;
  const documents: StepProgress = { key: "documents", errorCount: docErrors, completeCount: docVerified, totalCount: requiredDocs.length, status: docErrors === 0 ? "complete" : "pending" };

  const review: StepProgress = { key: "review", errorCount: 0, completeCount: 0, totalCount: 1, status: "pending" };

  return { identity, kyc, fatca, bank, nominees, risk, relationship, documents, review };
}

function lockReview(progress: Record<StepKey, StepProgress>): Record<StepKey, StepProgress> {
  const preReviewKeys: StepKey[] = ["identity", "kyc", "fatca", "bank", "risk", "relationship", "documents"];
  const allComplete = preReviewKeys.every((k) => progress[k].status === "complete");
  const documentsReady = progress.documents.status === "complete" || progress.bank.status === "complete";
  const next = { ...progress };
  if (!documentsReady) next.documents = { ...next.documents, status: "locked" as StepValidity };
  if (!allComplete) next.review = { ...next.review, status: "locked" as StepValidity };
  return next;
}

export function InvestorOnboardingPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<OnboardingDraft>(() => createEmptyDraft());
  const [currentStep, setCurrentStep] = useState<StepKey>("identity");
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>();
  const [pendingNav, setPendingNav] = useState<{ key: StepKey } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (patch: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setIsDirty(true);
  };

  const progress = useMemo(() => lockReview(computeProgress(draft)), [draft]);

  const overallPct = useMemo(() => {
    const keys: StepKey[] = ["identity", "kyc", "fatca", "bank", "nominees", "risk", "relationship", "documents"];
    const done = keys.filter((k) => progress[k].status === "complete").length;
    return Math.round((done / keys.length) * 100);
  }, [progress]);

  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.key === currentStep);
  const isLast = currentStep === "review";

  const goTo = (key: StepKey) => {
    if (progress[key].status === "locked") return;
    if (isDirty) {
      setPendingNav({ key });
      return;
    }
    setCurrentStep(key);
  };

  const confirmDiscard = () => {
    if (pendingNav) {
      setCurrentStep(pendingNav.key);
      setIsDirty(false);
      setPendingNav(null);
    }
  };

  const handleContinue = () => {
    const next = ONBOARDING_STEPS[currentIndex + 1];
    if (!next) return;
    if (progress[next.key].status === "locked") {
      toast.warning("Complete preceding steps to unlock this section.");
      return;
    }
    setCurrentStep(next.key);
    setIsDirty(false);
  };

  const handleBack = () => {
    const prev = ONBOARDING_STEPS[currentIndex - 1];
    if (prev) setCurrentStep(prev.key);
  };

  const handleSaveDraft = () => {
    const now = new Date().toISOString();
    setLastSavedAt(now);
    setIsDirty(false);
    toast.success("Draft saved", { description: `Resume any time. Draft ID ${draft.draftId}` });
  };

  const handleExit = () => navigate({ to: "/app/admin/onboarding" });

  const blockingIssues = useMemo(() => {
    const out: string[] = [];
    if (progress.identity.errorCount > 0) out.push("Identity fields are incomplete or invalid");
    if (progress.kyc.status !== "complete") out.push("KYC must be verified and consent captured");
    if (progress.fatca.status !== "complete") out.push("FATCA declaration is incomplete");
    if (progress.bank.status !== "complete") out.push("At least one verified primary bank account is required");
    if (progress.risk.status !== "complete") out.push("Risk profile must be computed or overridden");
    if (progress.relationship.status !== "complete") out.push("RM and distributor must be assigned");
    if (progress.documents.status !== "complete") out.push("All required documents must be uploaded and verified");
    if (!draft.consent.termsAck || !draft.consent.dataProcessingAck || !draft.consent.declarationAck)
      out.push("All required consents must be accepted");
    return out;
  }, [progress, draft.consent]);

  const canContinue = progress[currentStep].errorCount === 0 || currentStep === "nominees";
  const canSubmit = blockingIssues.length === 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Onboarding submitted", { description: "Routed to compliance for final review." });
      navigate({ to: "/app/admin/onboarding" });
    }, 900);
  };

  const stepTitle = ONBOARDING_STEPS[currentIndex];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Onboarding"
        title="New investor onboarding"
        description={`Draft ${draft.draftId} · created ${new Date(draft.createdAt).toLocaleDateString()}`}
      />
      <WorkflowHeader
        draftId={draft.draftId}
        lastSavedAt={lastSavedAt}
        isDirty={isDirty}
        onSaveDraft={handleSaveDraft}
        onExit={handleExit}
      />

      <div className="px-6 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <WorkflowStepper
            steps={ONBOARDING_STEPS}
            currentStep={currentStep}
            progress={progress}
            onStepClick={goTo}
            overallPct={overallPct}
          />

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {stepTitle.index} of {ONBOARDING_STEPS.length}
                </p>
                <h2 className="text-xl font-bold tracking-tight">{stepTitle.label}</h2>
                <p className="text-sm text-muted-foreground">{stepTitle.description}</p>
              </div>
            </div>

            {currentStep === "identity" && <Step1Identity value={draft.identity} onChange={(v) => update({ identity: v })} />}
            {currentStep === "kyc" && <Step2KycCompliance value={draft.kyc} onChange={(v) => update({ kyc: v })} />}
            {currentStep === "fatca" && <Step3FatcaTaxation value={draft.fatca} onChange={(v) => update({ fatca: v })} />}
            {currentStep === "bank" && <Step4BankAccounts value={draft.banks} onChange={(v) => update({ banks: v })} />}
            {currentStep === "nominees" && <Step5Nominees value={draft.nominees} onChange={(v) => update({ nominees: v })} />}
            {currentStep === "risk" && <Step6RiskProfile value={draft.risk} onChange={(v) => update({ risk: v })} />}
            {currentStep === "relationship" && <Step7RelationshipMapping value={draft.relationship} onChange={(v) => update({ relationship: v })} />}
            {currentStep === "documents" && <Step8Documents value={draft.documents} onChange={(v) => update({ documents: v })} />}
            {currentStep === "review" && (
              <Step9ReviewSubmit
                draft={draft}
                onJump={(k) => setCurrentStep(k)}
                consent={draft.consent}
                onConsentChange={(c) => update({ consent: c })}
                blockingIssues={blockingIssues}
              />
            )}

            <WorkflowActionBar
              isFirst={currentIndex === 0}
              isLast={isLast}
              canContinue={canContinue}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onContinue={handleContinue}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              helperText={isLast ? (canSubmit ? "Ready to submit" : `${blockingIssues.length} issue${blockingIssues.length > 1 ? "s" : ""} to resolve`) : undefined}
            />
          </div>
        </div>
      </div>

      <UnsavedChangesDialog
        open={!!pendingNav}
        onCancel={() => setPendingNav(null)}
        onConfirm={confirmDiscard}
      />
    </>
  );
}
