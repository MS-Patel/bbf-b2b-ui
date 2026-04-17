import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand/brand-logo";

import { useForgotPasswordMutation } from "@/features/auth/api";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schemas";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — WealthOS" },
      { name: "description", content: "Reset your WealthOS account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const mutation = useForgotPasswordMutation();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      setSent(true);
      toast.success("Reset link sent");
    } catch {
      toast.error("Could not send reset link");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email associated with your account and we'll send you a reset link.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Send reset link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{form.getValues("email")}</span>,
                a reset link is on its way.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
