import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreditCard, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { ChartSkeleton } from "@/components/feedback/skeletons";
import { KycTimeline } from "@/features/kyc/components/kyc-timeline";
import { useKycOverviewQuery } from "@/features/kyc/api";
import { useAuthStore } from "@/stores/auth-store";
import { useImpersonationStore } from "@/features/impersonation/store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KycOverallStatus } from "@/types/kyc";

export const Route = createFileRoute("/app/investor/profile")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    const impersonating = useImpersonationStore.getState().client;
    if (!impersonating && user) throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "KYC & Profile — Read-only" }] }),
  component: ProfilePage,
});

const STATUS_TONE: Record<KycOverallStatus, StatusTone> = {
  verified: "success",
  in_review: "info",
  pending: "warning",
  rejected: "destructive",
  not_started: "muted",
};
const STATUS_LABEL: Record<KycOverallStatus, string> = {
  verified: "Verified",
  in_review: "In review",
  pending: "Pending",
  rejected: "Rejected",
  not_started: "Not started",
};

function ProfilePage() {
  const { data, isLoading } = useKycOverviewQuery();
  const banks = data?.bankAccounts ?? [];
  const nominees = data?.nominees ?? [];
  const totalShare = nominees.reduce((sum, n) => sum + n.sharePct, 0);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="KYC & Profile"
        description="Read-only view of this client's KYC status, bank accounts, and nominees."
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {isLoading || !data ? (
          <Card className="shadow-card">
            <CardContent className="p-6">
              <ChartSkeleton height={320} />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden shadow-card">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold">{data.profile.fullName}</h3>
                      <StatusBadge tone={STATUS_TONE[data.status]} label={STATUS_LABEL[data.status]} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      KYC via {data.provider} · last updated {formatDate(data.lastUpdated)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="border-0 bg-success/12 text-success">
                  BSE-ready
                </Badge>
              </CardContent>
            </Card>

            <Tabs defaultValue="kyc" className="space-y-6">
              <TabsList>
                <TabsTrigger value="kyc">KYC status</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="banks">Bank accounts</TabsTrigger>
                <TabsTrigger value="nominees">Nominees</TabsTrigger>
              </TabsList>

              <TabsContent value="kyc" className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>NDML KYC progress</CardTitle>
                    <CardDescription>
                      Step-by-step status of the KYC application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <KycTimeline steps={data.steps} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Personal details</CardTitle>
                    <CardDescription>Information on file with the KYC provider.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
                    <Field label="PAN" value={data.profile.panMasked} mono />
                    <Field label="Aadhaar" value={data.profile.aadhaarMasked} mono />
                    <Field label="Date of birth" value={formatDate(data.profile.dob)} />
                    <Field label="Email" value={data.profile.email} icon={Mail} />
                    <Field label="Phone" value={data.profile.phone} icon={Phone} />
                    <Field
                      label="Address"
                      icon={MapPin}
                      value={
                        <span>
                          {data.profile.address.line1}
                          {data.profile.address.line2 ? `, ${data.profile.address.line2}` : ""},{" "}
                          {data.profile.address.city}, {data.profile.address.state}{" "}
                          {data.profile.address.pincode}
                        </span>
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="banks" className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Linked bank accounts</h3>
                  <p className="text-sm text-muted-foreground">Used for purchases, SIPs, and redemption credits.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {banks.map((b) => (
                    <Card key={b.id} className={cn("shadow-card", b.isPrimary && "ring-1 ring-primary/30")}>
                      <CardContent className="flex items-start justify-between gap-3 p-5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{b.bankName}</p>
                              {b.isPrimary && (
                                <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                              {b.accountNumberMasked} · {b.ifsc}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                              {b.accountType === "savings" ? "Savings" : "Current"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge tone={b.verified ? "success" : "warning"} label={b.verified ? "Verified" : "Pending"} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="nominees" className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Registered nominees</h3>
                  <p className="text-sm text-muted-foreground">
                    Total share: <span className="font-semibold text-foreground">{totalShare}%</span> of 100%.
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {nominees.map((n) => (
                    <Card key={n.id} className="shadow-card">
                      <CardContent className="flex items-center justify-between gap-3 p-5">
                        <div>
                          <p className="font-semibold">{n.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {n.relation} · DOB {formatDate(n.dob)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-2xl font-bold tabular-nums">{n.sharePct}%</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">share</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}

interface FieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}

function Field({ label, value, icon: Icon, mono }: FieldProps) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-medium", mono && "font-mono")}>{value}</p>
    </div>
  );
}
