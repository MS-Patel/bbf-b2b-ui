import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Clock, AlertCircle, UserCog, ArrowRight, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import {
  ONBOARDING_OWNERS,
  useUpdateKycChecklistMutation,
  useAdvanceStageMutation,
  useReassignLeadMutation,
  useRejectLeadMutation,
  useConvertLeadMutation,
} from "@/features/onboarding/api";
import { KYC_ITEM_LABELS, STAGE_LABELS, type KycItemKey, type KycItemStatus, type LeadStage, type OnboardingLead } from "@/features/onboarding/types";
import { useImpersonationStore } from "@/features/impersonation/store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<KycItemStatus, StatusTone> = {
  pending: "muted",
  submitted: "info",
  verified: "success",
  rejected: "destructive",
};

const STAGE_TONE: Record<LeadStage, StatusTone> = {
  lead: "muted",
  kyc_started: "info",
  kyc_in_review: "warning",
  verified: "success",
  first_invest: "info",
};

const STATUS_ICON: Record<KycItemStatus, typeof Check> = {
  pending: Clock,
  submitted: AlertCircle,
  verified: Check,
  rejected: X,
};

interface Props {
  lead: OnboardingLead | null;
  isAdmin?: boolean;
  onClose: () => void;
}

export function LeadDetailSheet({ lead, isAdmin = false, onClose }: Props) {
  const update = useUpdateKycChecklistMutation();
  const advance = useAdvanceStageMutation();
  const reassign = useReassignLeadMutation();
  const reject = useRejectLeadMutation();
  const convert = useConvertLeadMutation();
  const startImpersonation = useImpersonationStore((s) => s.start);
  const navigate = useNavigate();

  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [reassignTo, setReassignTo] = useState<string>("");

  if (!lead) return null;

  function setItem(item: KycItemKey, status: KycItemStatus) {
    update.mutate({ id: lead!.id, item, status });
  }

  async function handleApproveConvert() {
    const client = await convert.mutateAsync(lead!.id);
    toast.success("Client created", {
      description: `${client.fullName} is now an active client.`,
      action: {
        label: "Open as client",
        onClick: () => {
          startImpersonation(client);
          void navigate({ to: "/app/investor" });
        },
      },
    });
    onClose();
  }

  function handleReject() {
    if (rejectReason.trim().length < 5) {
      toast.error("Provide a brief reason (min 5 chars).");
      return;
    }
    reject.mutate({ id: lead!.id, reason: rejectReason }, {
      onSuccess: () => {
        toast.success("Lead rejected");
        setShowReject(false);
        setRejectReason("");
        onClose();
      },
    });
  }

  function handleReassign() {
    if (!reassignTo) return;
    reassign.mutate({ id: lead!.id, ownerId: reassignTo }, {
      onSuccess: () => {
        toast.success("Lead reassigned");
        setReassignTo("");
      },
    });
  }

  const allVerified = Object.values(lead.kycChecklist).every((v) => v === "verified");

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            {lead.fullName}
            <StatusBadge tone={STAGE_TONE[lead.stage]} label={STAGE_LABELS[lead.stage]} />
          </SheetTitle>
          <SheetDescription className="text-xs">
            {lead.email} · Owner: {lead.ownerName} ({lead.ownerRole})
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-5">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="kyc">KYC checklist</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3 pt-4 text-sm">
            <Field label="Phone" value={lead.phone ?? "—"} />
            <Field label="PAN" value={lead.pan ?? "—"} />
            <Field label="Source" value={lead.source} />
            <Field label="Owner" value={`${lead.ownerName} (${lead.ownerRole})`} />
            <Field label="Invite sent" value={lead.inviteSentAt ? formatDate(lead.inviteSentAt) : "—"} />
            <Field label="Last update" value={formatDate(lead.updatedAt)} />
            {lead.inviteLink && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Magic link</p>
                <code className="break-all text-xs">{lead.inviteLink}</code>
              </div>
            )}
            {lead.notes && <Field label="Notes" value={lead.notes} />}
            {lead.rejectionReason && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                Rejected: {lead.rejectionReason}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kyc" className="space-y-2 pt-4">
            {(Object.keys(KYC_ITEM_LABELS) as KycItemKey[]).map((key) => {
              const status = lead.kycChecklist[key];
              const Icon = STATUS_ICON[status];
              return (
                <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("grid h-8 w-8 place-items-center rounded-full", `text-${STATUS_TONE[status]}`)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{KYC_ITEM_LABELS[key]}</p>
                      <StatusBadge tone={STATUS_TONE[status]} label={status} />
                    </div>
                  </div>
                  <Select value={status} onValueChange={(v) => setItem(key, v as KycItemStatus)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="activity" className="space-y-2 pt-4">
            {lead.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{STAGE_LABELS[h.stage]}</p>
                  {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(h.at)}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Stage advance + actions */}
        <div className="mt-6 space-y-3 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <Select value={lead.stage} onValueChange={(v) => advance.mutate({ id: lead.id, stage: v as LeadStage })}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STAGE_LABELS) as LeadStage[]).map((s) => (
                  <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Reassign owner…" /></SelectTrigger>
                <SelectContent>
                  {ONBOARDING_OWNERS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name} · {o.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleReassign} disabled={!reassignTo} className="gap-1.5">
                <UserCog className="h-3.5 w-3.5" /> Reassign
              </Button>
            </div>
          )}

          {showReject ? (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection…" rows={2} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
                <Button size="sm" variant="destructive" onClick={handleReject} disabled={reject.isPending}>Confirm reject</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReject(true)} className="text-destructive hover:text-destructive">
                Reject lead
              </Button>
              {allVerified ? (
                <Button onClick={handleApproveConvert} disabled={convert.isPending} className="gap-1.5">
                  Approve & convert <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button disabled variant="outline" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Awaiting full KYC
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}
