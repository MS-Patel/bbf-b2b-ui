import { Users, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingLead } from "@/features/onboarding/types";

interface Props {
  leads: OnboardingLead[];
}

export function OnboardingStats({ leads }: Props) {
  const total = leads.length;
  const inReview = leads.filter((l) => l.stage === "kyc_in_review" || l.stage === "kyc_started").length;
  const now = new Date();
  const verifiedMtd = leads.filter((l) => {
    if (l.stage !== "verified" && l.stage !== "first_invest") return false;
    const d = new Date(l.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const converted = leads.filter((l) => l.stage === "first_invest").length;
  const conversion = total > 0 ? Math.round((converted / total) * 100) : 0;

  const stats = [
    { label: "Total leads", value: total.toString(), icon: Users },
    { label: "In KYC review", value: inReview.toString(), icon: Clock },
    { label: "Verified MTD", value: verifiedMtd.toString(), icon: ShieldCheck },
    { label: "Conversion %", value: `${conversion}%`, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
