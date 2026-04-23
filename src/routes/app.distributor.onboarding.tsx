import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useLeadsQuery } from "@/features/onboarding/api";
import { InviteLeadDialog } from "@/features/onboarding/components/invite-lead-dialog";
import { LeadKanban } from "@/features/onboarding/components/lead-kanban";
import { LeadTable } from "@/features/onboarding/components/lead-table";
import { LeadDetailSheet } from "@/features/onboarding/components/lead-detail-sheet";
import { OnboardingStats } from "@/features/onboarding/components/onboarding-stats";
import type { OnboardingLead } from "@/features/onboarding/types";

export const Route = createFileRoute("/app/distributor/onboarding")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "distributor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Onboarding — Distributor" }] }),
  component: DistributorOnboardingPage,
});

function DistributorOnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useLeadsQuery({ scope: "mine", ownerId: user?.id });
  const leads = data ?? [];
  const [selected, setSelected] = useState<OnboardingLead | null>(null);

  const owner = user
    ? { id: user.id, role: "distributor" as const, name: user.fullName }
    : { id: "usr_dist_001", role: "distributor" as const, name: "Rohan Kapoor" };

  return (
    <>
      <PageHeader
        eyebrow="Distributor · Onboarding"
        title="Lead pipeline"
        description={`${leads.length} leads under your ARN. Invite, track and convert.`}
        actions={
          <InviteLeadDialog
            owner={owner}
            trigger={<Button className="gap-1.5"><UserPlus className="h-4 w-4" /> Invite client</Button>}
          />
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <OnboardingStats leads={leads} />
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban" className="mt-4">
            <LeadKanban leads={leads} onSelect={setSelected} />
          </TabsContent>
          <TabsContent value="table" className="mt-4">
            <LeadTable leads={leads} onSelect={setSelected} />
          </TabsContent>
        </Tabs>
      </div>
      <LeadDetailSheet lead={selected} onClose={() => setSelected(null)} />
    </>
  );
}
