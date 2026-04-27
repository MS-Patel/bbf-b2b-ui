import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useLeadsQuery } from "@/features/onboarding/api";
import { LeadKanban } from "@/features/onboarding/components/lead-kanban";
import { LeadTable } from "@/features/onboarding/components/lead-table";
import { LeadDetailSheet } from "@/features/onboarding/components/lead-detail-sheet";
import { OnboardingStats } from "@/features/onboarding/components/onboarding-stats";
import type { OnboardingLead } from "@/features/onboarding/types";

export const Route = createFileRoute("/app/rm/onboarding")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "rm") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Onboarding — RM" }] }),
  component: RmOnboardingPage,
});

function RmOnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useLeadsQuery({ scope: "mine", ownerId: user?.id });
  const leads = data ?? [];
  const [selected, setSelected] = useState<OnboardingLead | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="RM · Onboarding"
        title="Conversion pipeline"
        description={`${leads.length} leads in flight across the funnel.`}
        actions={
          <Button asChild className="gap-1.5">
            <Link to="/app/rm/onboarding/new">
              <UserPlus className="h-4 w-4" /> Invite client
            </Link>
          </Button>
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
