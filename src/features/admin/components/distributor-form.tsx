import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { ACCOUNT_TYPES, STATE_CHOICES } from "@/features/admin/form-constants";
import type { DistributorProfile } from "@/types/admin";

export function DistributorForm({
  distributor,
  branches,
  rms,
  backTo,
  showAssignments = true,
  eyebrow = "Admin · Partners",
}: {
  distributor: DistributorProfile | null;
  branches: Array<{ id: string; name: string }>;
  rms: Array<{ id: string; name: string }>;
  backTo: string;
  showAssignments?: boolean;
  eyebrow?: string;
}) {
  const navigate = useNavigate();
  const isEdit = Boolean(distributor);
  const save = () => {
    toast.success(isEdit ? "Distributor updated" : "Distributor created");
    navigate({ to: backTo });
  };

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={isEdit ? `Update ${distributor?.name}` : "Create distributor"}
        description="Mock form mirroring the Django DistributorProfile model — identity, address, contact, business, and bank details."
        actions={
          <Button variant="outline" asChild className="gap-2">
            <Link to={backTo}><ArrowLeft className="h-4 w-4" /> Back to distributors</Link>
          </Button>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="space-y-6 p-6">
            <FormSection title="Identity">
              <Field label="Name"><Input defaultValue={distributor?.name} placeholder="Partner name" /></Field>
              <Field label="Email"><Input type="email" defaultValue={distributor?.email} placeholder="ops@example.in" /></Field>
              <Field label="ARN number"><Input defaultValue={distributor?.arn} placeholder="ARN-000000" /></Field>
              <Field label="Broker code"><Input placeholder="BBF0001 (auto-generated)" /></Field>
              <Field label="Old broker code"><Input placeholder="Legacy code (optional)" /></Field>
              <Field label="EUIN"><Input placeholder="E000000" /></Field>
              {showAssignments && (
                <>
                  <Field label="Branch">
                    <Select defaultValue={distributor?.branchId ?? branches[0]?.id}>
                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="RM owner">
                    <Select defaultValue={distributor?.rmOwnerId ?? rms[0]?.id}>
                      <SelectTrigger><SelectValue placeholder="Select RM" /></SelectTrigger>
                      <SelectContent>{rms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Parent distributor">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">None</SelectItem></SelectContent>
                    </Select>
                  </Field>
                </>
              )}
              <Field label="Status flags">
                <div className="flex h-10 items-center gap-4 rounded-md border border-input px-3">
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked={distributor?.status !== "suspended"} id="dist-active" />
                    <Label htmlFor="dist-active" className="text-sm font-normal text-muted-foreground">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked={distributor?.status === "active"} id="dist-approved" />
                    <Label htmlFor="dist-approved" className="text-sm font-normal text-muted-foreground">Approved</Label>
                  </div>
                </div>
              </Field>
            </FormSection>

            <FormSection title="Contact details">
              <Field label="Mobile"><Input defaultValue={distributor?.phone} placeholder="+91 98xxxxxxxx" /></Field>
              <Field label="Alternate mobile"><Input placeholder="+91…" /></Field>
              <Field label="Alternate email"><Input type="email" placeholder="alt@example.in" /></Field>
            </FormSection>

            <FormSection title="Address">
              <Field label="Address" className="sm:col-span-2"><Textarea rows={2} placeholder="Street, building, area" /></Field>
              <Field label="City"><Input defaultValue={distributor?.city} placeholder="Mumbai" /></Field>
              <Field label="Pincode"><Input maxLength={6} placeholder="400001" /></Field>
              <Field label="State">
                <Select defaultValue={distributor?.state}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{STATE_CHOICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Country"><Input defaultValue="India" /></Field>
            </FormSection>

            <FormSection title="Personal & business">
              <Field label="Date of birth / incorporation"><Input type="date" /></Field>
              <Field label="PAN"><Input maxLength={10} placeholder="ABCDE1234F" className="uppercase" /></Field>
              <Field label="GSTIN"><Input maxLength={15} placeholder="22ABCDE1234F1Z5" className="uppercase" /></Field>
            </FormSection>

            <FormSection title="Bank details">
              <Field label="Bank name"><Input placeholder="HDFC Bank" /></Field>
              <Field label="Account number"><Input placeholder="00112233445566" /></Field>
              <Field label="IFSC code"><Input maxLength={11} placeholder="HDFC0000123" className="uppercase" /></Field>
              <Field label="Account type">
                <Select defaultValue="SB">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Branch name"><Input placeholder="Andheri West" /></Field>
            </FormSection>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t bg-background/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <Button variant="outline" asChild><Link to={backTo}>Cancel</Link></Button>
          <Button onClick={save}>{isEdit ? "Save changes" : "Create distributor"}</Button>
        </div>
      </div>
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Separator />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
