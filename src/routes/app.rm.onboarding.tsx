import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRmLeadsQuery } from "@/features/rm/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeadStage, OnboardingLead } from "@/types/rm";

export const Route = createFileRoute("/app/rm/onboarding")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Onboarding — RM" }] }),
  component: RmOnboardingPage,
});

const STAGES: Array<{ id: LeadStage; label: string; tone: string }> = [
  { id: "lead", label: "New lead", tone: "bg-muted text-muted-foreground" },
  { id: "kyc_started", label: "KYC started", tone: "bg-info/15 text-info" },
  { id: "kyc_in_review", label: "KYC review", tone: "bg-warning/15 text-warning" },
  { id: "verified", label: "Verified", tone: "bg-success/15 text-success" },
  { id: "first_invest", label: "First invest", tone: "bg-primary/15 text-primary" },
];

function RmOnboardingPage() {
  const { data } = useRmLeadsQuery();
  const leads = data ?? [];

  const grouped: Record<LeadStage, OnboardingLead[]> = {
    lead: [], kyc_started: [], kyc_in_review: [], verified: [], first_invest: [],
  };
  leads.forEach((l) => grouped[l.stage].push(l));

  return (
    <>
      <PageHeader
        eyebrow="RM · Onboarding"
        title="Conversion pipeline"
        description={`${leads.length} leads in flight across the funnel.`}
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {STAGES.map((s) => (
            <Card key={s.id} className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{s.label}</CardTitle>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", s.tone)}>{grouped[s.id].length}</span>
                </div>
                <CardDescription className="text-xs">{stageDescription(s.id)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {grouped[s.id].length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">No leads</p>
                ) : (
                  grouped[s.id].map((l) => (
                    <div key={l.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="truncate text-sm font-semibold">{l.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.email}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                        <span>{l.source}</span>
                        <span>{formatDate(l.updatedAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function stageDescription(stage: LeadStage): string {
  switch (stage) {
    case "lead": return "Captured — awaiting first contact.";
    case "kyc_started": return "PAN/Aadhaar collected.";
    case "kyc_in_review": return "Submitted to NDML.";
    case "verified": return "KYC complete — ready to invest.";
    case "first_invest": return "First order placed.";
  }
}
