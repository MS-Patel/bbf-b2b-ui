import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUploadReconciliationFileMutation } from "@/features/reconciliation/api";
import { useAuthStore } from "@/stores/auth-store";
import type { RtaSource } from "@/types/reconciliation";

interface UploadWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = ["Source", "File", "Review"] as const;

export function UploadWizard({ open, onOpenChange }: UploadWizardProps) {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<RtaSource>("CAMS");
  const [fileName, setFileName] = useState("");
  const upload = useUploadReconciliationFileMutation();
  const user = useAuthStore((s) => s.user);

  function reset() {
    setStep(0);
    setSource("CAMS");
    setFileName("");
  }

  async function submit() {
    try {
      const file = await upload.mutateAsync({
        source,
        fileName: fileName.trim(),
        uploadedBy: user?.fullName ?? "System",
      });
      toast.success("Upload queued", { description: `${file.fileName} is now processing.` });
      onOpenChange(false);
      setTimeout(reset, 200);
    } catch {
      toast.error("Upload failed");
    }
  }

  const canNext = step === 0 ? true : step === 1 ? fileName.trim().length >= 3 : true;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload RTA mailback</DialogTitle>
          <DialogDescription>
            Ingest a CAMS or KFinTech mailback file and run reconciliation against active orders.
          </DialogDescription>
        </DialogHeader>

        <Stepper step={step} />

        <div className="py-2">
          {step === 0 && (
            <div className="space-y-3">
              <Label>Pick the RTA source</Label>
              <RadioGroup
                value={source}
                onValueChange={(v) => setSource(v as RtaSource)}
                className="grid gap-2"
              >
                <SourceOption value="CAMS" label="CAMS" description="Computer Age Management Services" current={source} />
                <SourceOption value="KFINTECH" label="KFinTech" description="KFin Technologies (formerly Karvy)" current={source} />
              </RadioGroup>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Label htmlFor="fileName">File name</Label>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 p-4">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="fileName"
                  placeholder={source === "CAMS" ? "CAMS_MAILBACK_YYYYMMDD.txt" : "KFIN_MB_YYYYMMDD.csv"}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                In production this would be a drag-and-drop uploader. Mock mode accepts any file name.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
              <Row label="RTA source" value={<Badge variant="secondary">{source}</Badge>} />
              <Row label="File" value={<span className="font-mono text-xs">{fileName}</span>} />
              <Row label="Uploader" value={user?.fullName ?? "—"} />
              <p className="pt-2 text-xs text-muted-foreground">
                On submit, the file is queued and processed asynchronously. You'll see results in the files table.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || upload.isPending}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="gap-1.5">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={upload.isPending} className="gap-1.5">
              {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Submit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourceOption({
  value,
  label,
  description,
  current,
}: {
  value: RtaSource;
  label: string;
  description: string;
  current: RtaSource;
}) {
  const active = current === value;
  return (
    <Label
      htmlFor={`src-${value}`}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors",
        active && "border-primary/50 bg-primary/5",
      )}
    >
      <RadioGroupItem id={`src-${value}`} value={value} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
    </Label>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 pt-2">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="ml-1 h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
