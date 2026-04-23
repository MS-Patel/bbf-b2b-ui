import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, type LeadStage, type OnboardingLead } from "@/features/onboarding/types";
import { formatDate } from "@/lib/format";

const STAGES: Array<{ id: LeadStage; tone: string; description: string }> = [
  { id: "lead", tone: "bg-muted text-muted-foreground", description: "Captured — awaiting first contact." },
  { id: "kyc_started", tone: "bg-info/15 text-info", description: "PAN/Aadhaar collected." },
  { id: "kyc_in_review", tone: "bg-warning/15 text-warning", description: "Submitted to NDML." },
  { id: "verified", tone: "bg-success/15 text-success", description: "KYC complete — ready to invest." },
  { id: "first_invest", tone: "bg-primary/15 text-primary", description: "First order placed." },
];

interface Props {
  leads: OnboardingLead[];
  onSelect: (lead: OnboardingLead) => void;
}

export function LeadKanban({ leads, onSelect }: Props) {
  const grouped: Record<LeadStage, OnboardingLead[]> = {
    lead: [], kyc_started: [], kyc_in_review: [], verified: [], first_invest: [],
  };
  leads.forEach((l) => grouped[l.stage].push(l));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {STAGES.map((s) => (
        <Card key={s.id} className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{STAGE_LABELS[s.id]}</CardTitle>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", s.tone)}>{grouped[s.id].length}</span>
            </div>
            <CardDescription className="text-xs">{s.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped[s.id].length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card/40 p-4 text-center text-xs text-muted-foreground">No leads</p>
            ) : (
              grouped[s.id].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onSelect(l)}
                  className="w-full rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
                >
                  <p className="truncate text-sm font-semibold">{l.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.email}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                    <span>{l.source}</span>
                    <span>{formatDate(l.updatedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
