import { createFileRoute, redirect } from "@tanstack/react-router";
import { Lock, Palette, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { ROLE_LABEL } from "@/features/auth/role-routes";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Settings — WealthOS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  if (!user) return null;

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, security, and notification preferences."
      />

      <div className="px-6 py-6 sm:px-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Palette className="h-4 w-4" /> Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Used across statements, KYC, and order confirmations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" defaultValue={user.fullName} />
                  <Field label="Email" defaultValue={user.email} type="email" />
                  <Field label="Phone" defaultValue={user.phone ?? "+91 9876543210"} />
                  <div className="flex flex-col gap-2">
                    <Label>Role</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-secondary/50 px-3 text-sm">
                      <Badge variant="secondary" className="border-0 bg-accent/15 text-accent">
                        {ROLE_LABEL[user.role]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost">Cancel</Button>
                  <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" /> KYC
                </CardTitle>
                <CardDescription>Complete CKYC profile linked to PAN ABCDE1234F.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Stat label="Status" value="Verified" tone="success" />
                <Stat label="KRA" value="CAMS" />
                <Stat label="Last updated" value="12 Mar 2026" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Use a strong, unique password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Current password" type="password" placeholder="••••••••" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" type="password" placeholder="At least 8 characters" />
                  <Field label="Confirm password" type="password" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Password updated")}>Update password</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Two-factor authentication</CardTitle>
                <CardDescription>Add a second layer of security to your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  title="Authenticator app"
                  description="Time-based codes via Google Authenticator or Authy."
                />
                <Separator />
                <ToggleRow title="SMS OTP" description="Receive codes on your registered mobile." defaultChecked />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Adjust the look and feel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  title="Dark mode"
                  description="Reduces eye strain in low-light environments."
                  checked={theme === "dark"}
                  onCheckedChange={() => toggleTheme()}
                />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose which alerts you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow title="Order executions" description="Allotments, redemptions, switches." defaultChecked />
                <Separator />
                <ToggleRow title="SIP reminders" description="Day-before reminders & failed mandate alerts." defaultChecked />
                <Separator />
                <ToggleRow title="KYC & compliance" description="Re-KYC, mandate expiry, PAN updates." defaultChecked />
                <Separator />
                <ToggleRow title="Marketing & insights" description="New funds, market commentary, blog updates." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  ...switchProps
}: { title: string; description: string } & React.ComponentProps<typeof Switch>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch {...switchProps} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${tone === "success" ? "text-success" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
