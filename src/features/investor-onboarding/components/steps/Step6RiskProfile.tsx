import { useMemo } from "react";
import { Gauge, ShieldAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { ValidationBanner } from "../ValidationBanner";
import { RISK_QUESTIONS } from "../../constants";
import type { RiskData, RiskLevel } from "../../types";
import { cn } from "@/lib/utils";

export interface Step6Props {
  value: RiskData;
  onChange: (next: RiskData) => void;
}

const GROUP_LABEL: Record<string, string> = {
  horizon: "Investment horizon",
  tolerance: "Loss tolerance",
  experience: "Experience",
  goals: "Goals",
};

function levelFromScore(score: number, max: number): RiskLevel {
  const pct = score / max;
  if (pct < 0.45) return "Conservative";
  if (pct < 0.75) return "Moderate";
  return "Aggressive";
}

const LEVEL_TONE: Record<RiskLevel, string> = {
  Conservative: "bg-info/10 text-info ring-info/20",
  Moderate: "bg-warning/10 text-warning ring-warning/20",
  Aggressive: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function Step6RiskProfile({ value, onChange }: Step6Props) {
  const { score, max, computed, complete } = useMemo(() => {
    const max = RISK_QUESTIONS.reduce((s, q) => s + Math.max(...q.options.map((o) => o.score)), 0);
    const score = RISK_QUESTIONS.reduce((s, q) => s + (value.answers[q.id] ?? 0), 0);
    const complete = RISK_QUESTIONS.every((q) => typeof value.answers[q.id] === "number");
    const computed = complete ? levelFromScore(score, max) : undefined;
    return { score, max, computed, complete };
  }, [value.answers]);

  const setAnswer = (qid: string, sc: number) => {
    const answers = { ...value.answers, [qid]: sc };
    const maxLocal = RISK_QUESTIONS.reduce((s, q) => s + Math.max(...q.options.map((o) => o.score)), 0);
    const total = Object.values(answers).reduce((s, v) => s + v, 0);
    const done = RISK_QUESTIONS.every((q) => typeof answers[q.id] === "number");
    onChange({ ...value, answers, computedLevel: done ? levelFromScore(total, maxLocal) : undefined });
  };

  const effective: RiskLevel | undefined = value.overrideLevel ?? computed;
  const grouped = RISK_QUESTIONS.reduce<Record<string, typeof RISK_QUESTIONS>>((acc, q) => {
    (acc[q.group] ??= []).push(q);
    return acc;
  }, {});

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {Object.entries(grouped).map(([group, qs]) => (
          <SectionCard key={group} title={GROUP_LABEL[group] ?? group} density="compact">
            <div className="space-y-4">
              {qs.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium">{q.question}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {q.options.map((o, i) => {
                      const selected = value.answers[q.id] === o.score;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAnswer(q.id, o.score)}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-background/40 hover:border-primary/40",
                          )}
                        >
                          <span>{o.label}</span>
                          <span className="text-[11px] font-semibold text-muted-foreground">+{o.score}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> Computed risk profile
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tabular-nums">{score}<span className="text-base text-muted-foreground">/{max}</span></span>
            {effective && (
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset", LEVEL_TONE[effective])}>{effective}</span>
            )}
          </div>
          {!complete && <p className="mt-2 text-xs text-muted-foreground">Answer all questions to compute the risk profile.</p>}
          {complete && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Suitability based on responses. Investor will see products tagged for this risk level by default.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Advisor override
          </div>
          <div className="mt-3 space-y-2">
            <Label className="text-xs">Override classification</Label>
            <Select value={value.overrideLevel ?? "_none"} onValueChange={(v) => onChange({ ...value, overrideLevel: v === "_none" ? undefined : (v as RiskLevel) })}>
              <SelectTrigger><SelectValue placeholder="No override" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No override (use computed)</SelectItem>
                <SelectItem value="Conservative">Conservative</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {value.overrideLevel && (
            <>
              <ValidationBanner
                tone="warning"
                title="Override requires justification"
                description="This is logged in audit and reviewed by compliance."
                className="mt-3"
              />
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs">Justification</Label>
                <Textarea value={value.overrideNote ?? ""} onChange={(e) => onChange({ ...value, overrideNote: e.target.value })} rows={3} placeholder="Reason for override…" />
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
