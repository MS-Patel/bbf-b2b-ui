import { FileCheck, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "../SectionCard";
import type { DocStatus, DocumentItem } from "../../types";

const TONE: Record<DocStatus, StatusTone> = {
  missing: "muted",
  uploading: "info",
  uploaded: "info",
  verifying: "warning",
  verified: "success",
  rejected: "destructive",
};

const LABEL: Record<DocStatus, string> = {
  missing: "Required",
  uploading: "Uploading",
  uploaded: "Awaiting check",
  verifying: "Verifying",
  verified: "Verified",
  rejected: "Rejected",
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export interface Step8Props {
  value: DocumentItem[];
  onChange: (next: DocumentItem[]) => void;
}

export function Step8Documents({ value, onChange }: Step8Props) {
  const required = value.filter((d) => d.required);
  const optional = value.filter((d) => !d.required);

  const updateDoc = (key: string, patch: Partial<DocumentItem>) =>
    onChange(value.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const handleFile = (key: string, file: File) => {
    updateDoc(key, { status: "uploading", fileName: file.name, sizeBytes: file.size, progress: 12 });
    // simulate upload progress + verification
    let pct = 12;
    const tick = setInterval(() => {
      pct += 22;
      if (pct >= 100) {
        clearInterval(tick);
        updateDoc(key, { status: "verifying", progress: 100, uploadedAt: new Date().toISOString() });
        setTimeout(() => updateDoc(key, { status: "verified" }), 900);
      } else {
        updateDoc(key, { progress: pct });
      }
    }, 250);
  };

  const removeDoc = (key: string) => updateDoc(key, { status: "missing", fileName: undefined, sizeBytes: undefined, progress: undefined, uploadedAt: undefined, rejectionReason: undefined });

  return (
    <div className="space-y-5">
      <SectionCard title="Required documents" description="All three required documents must be uploaded and verified to submit.">
        <div className="grid gap-3 lg:grid-cols-3">
          {required.map((d) => <DocTile key={d.key} doc={d} onFile={(f) => handleFile(d.key, f)} onRemove={() => removeDoc(d.key)} />)}
        </div>
      </SectionCard>

      <SectionCard title="Optional documents" description="Recommended — speed up activation.">
        <div className="grid gap-3 lg:grid-cols-3">
          {optional.map((d) => <DocTile key={d.key} doc={d} onFile={(f) => handleFile(d.key, f)} onRemove={() => removeDoc(d.key)} />)}
        </div>
      </SectionCard>
    </div>
  );
}

function DocTile({ doc, onFile, onRemove }: { doc: DocumentItem; onFile: (f: File) => void; onRemove: () => void }) {
  const tone = TONE[doc.status];
  const isUploaded = doc.status !== "missing";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{doc.label}</p>
          {doc.description && <p className="mt-0.5 text-xs text-muted-foreground">{doc.description}</p>}
        </div>
        <StatusBadge tone={tone} label={LABEL[doc.status]} />
      </div>

      {!isUploaded && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary/40">
          <FileCheck className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-foreground">Upload file</span>
          <span>PDF, JPG or PNG · up to 10 MB</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      )}

      {isUploaded && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{doc.fileName}</p>
              <p className="text-[11px] text-muted-foreground">
                {doc.sizeBytes ? formatBytes(doc.sizeBytes) : ""}
                {doc.uploadedAt && <> · {new Date(doc.uploadedAt).toLocaleTimeString()}</>}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <label className="cursor-pointer">
                <Button type="button" size="icon" variant="ghost" asChild>
                  <span><RefreshCw className="h-3.5 w-3.5" /></span>
                </Button>
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </label>
              <Button type="button" size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {doc.status === "uploading" && typeof doc.progress === "number" && <Progress value={doc.progress} className="h-1" />}
          {doc.status === "rejected" && doc.rejectionReason && (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" /> {doc.rejectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
