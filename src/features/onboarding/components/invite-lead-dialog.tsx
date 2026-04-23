import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { inviteLeadSchema, type InviteLeadInput } from "@/features/onboarding/schemas";
import { useInviteLeadMutation } from "@/features/onboarding/api";
import type { OwnerRole } from "@/features/onboarding/types";
import { useState, type ReactNode } from "react";

interface Props {
  trigger: ReactNode;
  owner: { id: string; role: OwnerRole; name: string };
}

export function InviteLeadDialog({ trigger, owner }: Props) {
  const [open, setOpen] = useState(false);
  const invite = useInviteLeadMutation(owner);

  const form = useForm<InviteLeadInput>({
    resolver: zodResolver(inviteLeadSchema),
    defaultValues: { fullName: "", email: "", phone: "", pan: "", source: "RM Direct", notes: "" },
  });

  async function onSubmit(values: InviteLeadInput) {
    const lead = await invite.mutateAsync(values);
    if (lead.inviteLink) {
      try {
        await navigator.clipboard?.writeText(lead.inviteLink);
        toast.success("Lead invited", {
          description: "Magic link copied to clipboard.",
          action: { label: "Copy again", onClick: () => navigator.clipboard?.writeText(lead.inviteLink!) },
        });
      } catch {
        toast.success("Lead invited", { description: lead.inviteLink });
      }
    }
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Invite a new investor</DialogTitle>
          <DialogDescription>
            Capture lead details and send a secure onboarding magic link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...form.register("fullName")} placeholder="Aarav Mehta" />
              {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} placeholder="aarav@example.in" />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} placeholder="+91 98765 43210" />
              {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pan">PAN (optional)</Label>
              <Input id="pan" {...form.register("pan")} placeholder="ABCDE1234F" className="uppercase" />
              {form.formState.errors.pan && <p className="text-xs text-destructive">{form.formState.errors.pan.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Source</Label>
              <Select value={form.watch("source")} onValueChange={(v) => form.setValue("source", v as InviteLeadInput["source"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Campaign">Campaign</SelectItem>
                  <SelectItem value="RM Direct">RM Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes (internal)</Label>
              <Textarea id="notes" {...form.register("notes")} rows={2} placeholder="Conversation context, risk profile…" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={invite.isPending} className="gap-1.5">
              {invite.isPending ? <Copy className="h-3.5 w-3.5 animate-pulse" /> : <Send className="h-3.5 w-3.5" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
