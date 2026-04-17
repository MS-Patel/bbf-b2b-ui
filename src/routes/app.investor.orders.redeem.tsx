import { createFileRoute, redirect } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/app/investor/orders/redeem")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Redeem — WealthOS" }] }),
  component: RedeemStub,
});

const STEPS = [
  { id: "holding", label: "Pick holding" },
  { id: "amount", label: "Units or amount" },
  { id: "confirm", label: "Confirm redemption" },
];

function RedeemStub() {
  return (
    <>
      <PageHeader
        eyebrow="Withdraw"
        title="Redeem units"
        description="Withdraw all or part of any holding back to your bank account."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <WizardStepper steps={STEPS} current={0} />
          </CardContent>
        </Card>
        <ComingSoonCard
          feature="Redemption wizard"
          description="Redemption with exit-load preview, STT impact, and same-day credit eligibility ships in Phase 4."
        />
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6 text-sm text-muted-foreground">
            <Wallet className="h-5 w-5 text-primary" />
            Need help with a redemption today? Reach your relationship manager or write to [email protected].
          </CardContent>
        </Card>
      </div>
    </>
  );
}
