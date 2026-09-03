import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  orange: "bg-orange-50 text-orange-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

export function StatCard({
  id,
  title,
  value,
  sub,
  icon: Icon,
  tone = "sky",
}: {
  id?: string;
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {sub ? (
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          ) : null}
        </div>
        <div className={cn("shrink-0 rounded-xl p-2.5", TONES[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
