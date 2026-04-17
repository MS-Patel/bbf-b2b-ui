import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/app/investor/orders/sip")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Start a SIP — WealthOS" }] }),
  component: SipStub,
});

const STEPS = [
  { id: "scheme", label: "Choose scheme" },
  { id: "schedule", label: "Set schedule" },
  { id: "confirm", label: "Confirm mandate" },
];

function SipStub() {
  return (
    <>
      <PageHeader
        eyebrow="Invest"
        title="Start a SIP"
        description="Automate your investments with a Systematic Investment Plan."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <WizardStepper steps={STEPS} current={0} />
          </CardContent>
        </Card>
        <ComingSoonCard
          feature="SIP wizard"
          description="A full SIP setup flow — frequency, dates, NACH mandate registration, and step-up SIPs — lands in Phase 4."
        />
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6 text-sm text-muted-foreground">
            <CalendarClock className="h-5 w-5 text-primary" />
            For now, place a one-time investment via the Lumpsum wizard.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
