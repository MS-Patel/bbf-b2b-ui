import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComingSoonCardProps {
  feature: string;
  description: string;
}

export function ComingSoonCard({ feature, description }: ComingSoonCardProps) {
  return (
    <Card className="overflow-hidden border-dashed bg-gradient-surface">
      <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl gradient-accent shadow-glow">
          <Sparkles className="h-6 w-6 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{feature}</h3>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Phase 2</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
