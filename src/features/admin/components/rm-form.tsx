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
import type { RmProfile } from "@/types/admin";

export function RmForm({
  rm,
  branches,
  distributors,
  backTo,
}: {
  rm: RmProfile | null;
  branches: Array<{ id: string; name: string }>;
  distributors: Array<{ id: string; name: string }>;
  backTo: string;
}) {
  const navigate = useNavigate();
  const isEdit = Boolean(rm);
  const save = () => {
    toast.success(isEdit ? "RM updated" : "RM created");
    navigate({ to: backTo });
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin · Team"
        title={isEdit ? `Update ${rm?.name}` : "Create relationship manager"}
        description="Mock form mirroring the Django RMProfile model — identity, address, contact, personal, and bank details."
        actions={
          <Button variant="outline" asChild className="gap-2">
            <Link to={backTo}><ArrowLeft className="h-4 w-4" /> Back to RMs</Link>
          </Button>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="space-y-6 p-6">
            <FormSection title="Identity & assignment">
              <Field label="Full name"><Input defaultValue={rm?.name} placeholder="RM name" /></Field>
              <Field label="Employee code"><Input defaultValue={rm?.employeeCode} placeholder="RM-MUM-001" /></Field>
              <Field label="Email"><Input type="email" defaultValue={rm?.email} placeholder="rm@buybestfin.app" /></Field>
              <Field label="Branch">
                <Select defaultValue={rm?.branchId ?? branches[0]?.id}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Primary distributor">
                <Select defaultValue={rm?.distributorIds[0] ?? distributors[0]?.id}>
                  <SelectTrigger><SelectValue placeholder="Select distributor" /></SelectTrigger>
                  <SelectContent>{distributors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Active">
                <div className="flex h-10 items-center gap-3 rounded-md border border-input px-3">
                  <Switch defaultChecked={rm?.status !== "suspended"} id="rm-active" />
                  <Label htmlFor="rm-active" className="text-sm font-normal text-muted-foreground">RM profile is active</Label>
                </div>
              </Field>
            </FormSection>

            <FormSection title="Contact details">
              <Field label="Mobile"><Input defaultValue={rm?.phone} placeholder="+91 98xxxxxxxx" /></Field>
              <Field label="Alternate mobile"><Input placeholder="+91…" /></Field>
              <Field label="Alternate email"><Input type="email" placeholder="alt@example.in" /></Field>
            </FormSection>

            <FormSection title="Address">
              <Field label="Address" className="sm:col-span-2"><Textarea rows={2} placeholder="Street, building, area" /></Field>
              <Field label="City"><Input placeholder="Mumbai" /></Field>
              <Field label="Pincode"><Input maxLength={6} placeholder="400001" /></Field>
              <Field label="State">
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{STATE_CHOICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Country"><Input defaultValue="India" /></Field>
            </FormSection>

            <FormSection title="Personal & business">
              <Field label="Date of birth"><Input type="date" /></Field>
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
          <Button onClick={save}>{isEdit ? "Save changes" : "Create RM"}</Button>
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
