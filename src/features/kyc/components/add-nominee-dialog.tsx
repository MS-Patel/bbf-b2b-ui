import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addNomineeSchema, type AddNomineeValues } from "@/features/kyc/schemas";
import type { Nominee } from "@/types/kyc";

interface AddNomineeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current allocated share total — must end up ≤ 100. */
  currentShareTotal: number;
  onAdd: (nominee: Nominee) => void;
}

export function AddNomineeDialog({ open, onOpenChange, currentShareTotal, onAdd }: AddNomineeDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const remaining = Math.max(100 - currentShareTotal, 0);

  const form = useForm<AddNomineeValues>({
    resolver: zodResolver(addNomineeSchema),
    defaultValues: { name: "", relation: "", dob: "", sharePct: remaining || 1 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.sharePct > remaining) {
      form.setError("sharePct", { message: `Only ${remaining}% remaining` });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const nominee: Nominee = {
      id: `nom_${Date.now()}`,
      name: values.name,
      relation: values.relation,
      dob: values.dob,
      sharePct: values.sharePct,
    };
    onAdd(nominee);
    setSubmitting(false);
    toast.success("Nominee added", { description: `${values.name} now holds ${values.sharePct}% share.` });
    form.reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add nominee</DialogTitle>
          <DialogDescription>
            Nominees inherit your folio in case of unforeseen events. Total share across all nominees must equal 100%.
            <span className="mt-1 block text-xs font-medium text-foreground">
              Remaining share: {remaining}%
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="As per Aadhaar" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="relation">Relation</Label>
              <Input id="relation" placeholder="Spouse, Child, Parent…" {...form.register("relation")} />
              {form.formState.errors.relation && (
                <p className="text-xs text-destructive">{form.formState.errors.relation.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" {...form.register("dob")} />
              {form.formState.errors.dob && (
                <p className="text-xs text-destructive">{form.formState.errors.dob.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sharePct">Share %</Label>
            <Input
              id="sharePct"
              type="number"
              min={1}
              max={100}
              {...form.register("sharePct", { valueAsNumber: true })}
            />
            {form.formState.errors.sharePct && (
              <p className="text-xs text-destructive">{form.formState.errors.sharePct.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={submitting || remaining === 0}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add nominee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
