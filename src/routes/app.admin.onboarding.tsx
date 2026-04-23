import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { useLeadsQuery } from "@/features/onboarding/api";
import { LeadKanban } from "@/features/onboarding/components/lead-kanban";
import { LeadTable } from "@/features/onboarding/components/lead-table";
import { LeadDetailSheet } from "@/features/onboarding/components/lead-detail-sheet";
import { OnboardingStats } from "@/features/onboarding/components/onboarding-stats";
import type { OnboardingLead } from "@/features/onboarding/types";

export const Route = createFileRoute("/app/admin/onboarding")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Onboarding — Admin" }] }),
  component: AdminOnboardingPage,
});

function AdminOnboardingPage() {
  const { data } = useLeadsQuery({ scope: "all" });
  const leads = data ?? [];
  const [selected, setSelected] = useState<OnboardingLead | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Admin · Onboarding"
        title="Platform onboarding"
        description={`${leads.length} leads across all RMs and distributors.`}
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <OnboardingStats leads={leads} />
        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
          <TabsContent value="table" className="mt-4">
            <LeadTable leads={leads} onSelect={setSelected} showOwnerFilter />
          </TabsContent>
          <TabsContent value="kanban" className="mt-4">
            <LeadKanban leads={leads} onSelect={setSelected} />
          </TabsContent>
        </Tabs>
      </div>
      <LeadDetailSheet lead={selected} isAdmin onClose={() => setSelected(null)} />
    </>
  );
}
