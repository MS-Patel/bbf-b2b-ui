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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addBankSchema, type AddBankValues } from "@/features/kyc/schemas";
import type { BankAccount } from "@/types/kyc";

interface AddBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (account: BankAccount) => void;
}

export function AddBankDialog({ open, onOpenChange, onAdd }: AddBankDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddBankValues>({
    resolver: zodResolver(addBankSchema),
    defaultValues: { bankName: "", accountNumber: "", ifsc: "", accountType: "savings" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    // Simulate verification round-trip
    await new Promise((r) => setTimeout(r, 700));
    const last4 = values.accountNumber.slice(-4);
    const account: BankAccount = {
      id: `bank_${Date.now()}`,
      bankName: values.bankName,
      accountNumberMasked: `XXXX-XXXX-${last4}`,
      ifsc: values.ifsc,
      accountType: values.accountType,
      isPrimary: false,
      verified: false,
    };
    onAdd(account);
    setSubmitting(false);
    toast.success("Bank account added", {
      description: "Penny-drop verification will complete in 24h.",
    });
    form.reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add bank account</DialogTitle>
          <DialogDescription>
            Used for purchases, SIP debits, and redemption credits. Penny-drop verification runs once added.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Bank name</Label>
            <Input id="bankName" placeholder="HDFC Bank" {...form.register("bankName")} />
            {form.formState.errors.bankName && (
              <p className="text-xs text-destructive">{form.formState.errors.bankName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber">Account number</Label>
            <Input
              id="accountNumber"
              inputMode="numeric"
              placeholder="123456789012"
              {...form.register("accountNumber")}
            />
            {form.formState.errors.accountNumber && (
              <p className="text-xs text-destructive">{form.formState.errors.accountNumber.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ifsc">IFSC code</Label>
              <Input
                id="ifsc"
                placeholder="HDFC0001234"
                className="font-mono uppercase"
                {...form.register("ifsc", {
                  setValueAs: (v: string) => (v ?? "").toUpperCase(),
                })}
              />
              {form.formState.errors.ifsc && (
                <p className="text-xs text-destructive">{form.formState.errors.ifsc.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Account type</Label>
              <Select
                value={form.watch("accountType")}
                onValueChange={(v) => form.setValue("accountType", v as "savings" | "current", { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
