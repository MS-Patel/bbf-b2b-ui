import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabbedDetailTab {
  id: string;
  label: string;
  badge?: string | number;
  content: ReactNode;
}

export interface TabbedDetailLayoutProps {
  header: ReactNode;
  tabs: TabbedDetailTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  defaultTab?: string;
  className?: string;
}

export function TabbedDetailLayout({
  header,
  tabs,
  activeTab,
  onTabChange,
  defaultTab,
  className,
}: TabbedDetailLayoutProps) {
  const initial = activeTab ?? defaultTab ?? tabs[0]?.id;
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="rounded-xl border border-border bg-card">{header}</div>
      <Tabs value={activeTab} defaultValue={initial} onValueChange={onTabChange} className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <TabsList className="h-auto w-max gap-1 bg-transparent p-0">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="data-[state=active]:bg-secondary data-[state=active]:text-foreground"
              >
                {t.label}
                {t.badge !== undefined && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {t.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className="mt-0">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
