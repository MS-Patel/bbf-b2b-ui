import { createFileRoute, redirect } from "@tanstack/react-router";
import { Repeat2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoonCard } from "@/components/layout/coming-soon-card";
import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/app/investor/orders/switch")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Switch funds — WealthOS" }] }),
  component: SwitchStub,
});

const STEPS = [
  { id: "from", label: "From scheme" },
  { id: "to", label: "To scheme" },
  { id: "confirm", label: "Confirm switch" },
];

function SwitchStub() {
  return (
    <>
      <PageHeader
        eyebrow="Reallocate"
        title="Switch between funds"
        description="Move units from one scheme to another within the same AMC, tax-efficiently."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <WizardStepper steps={STEPS} current={0} />
          </CardContent>
        </Card>
        <ComingSoonCard
          feature="Switch wizard"
          description="Intra-AMC switch with capital-gain preview and exit-load handling launches in Phase 4."
        />
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6 text-sm text-muted-foreground">
            <Repeat2 className="h-5 w-5 text-primary" />
            Switches are tax events — we'll surface STCG/LTCG impact before you confirm.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
