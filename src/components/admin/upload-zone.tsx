import { useRef, useState, type DragEvent } from "react";
import { File as FileIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadZoneFile {
  id: string;
  name: string;
  size: number;
  progress?: number; // 0-100
  status?: "queued" | "uploading" | "done" | "error";
  error?: string;
}

export interface UploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  files?: UploadZoneFile[];
  onFilesAdded?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  hint?: string;
  className?: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadZone({
  accept,
  multiple = true,
  maxSizeMb,
  files = [],
  onFilesAdded,
  onRemove,
  hint,
  className,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    onFilesAdded?.(Array.from(list));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40",
          dragOver && "border-primary bg-primary/5",
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium">Drop files here, or click to browse</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hint ?? `${accept ?? "Any file"}${maxSizeMb ? ` · up to ${maxSizeMb} MB` : ""}`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
                {typeof f.progress === "number" && f.status !== "done" && (
                  <Progress value={f.progress} className="mt-1.5 h-1" />
                )}
                {f.error && <p className="mt-0.5 text-xs text-destructive">{f.error}</p>}
              </div>
              {onRemove && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onRemove(f.id)}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
