import { CalendarClock, Fuel, Route, TrendingUp } from "lucide-react";

import type { FuelSummary } from "@/lib/stats";
import { fmtDate, fmtDays, fmtInt, fmtKmpl, fmtLiters, fmtTaka } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function LastFillCard({ fuel }: { fuel: FuelSummary }) {
  const done = fuel.lastCompleted;
  const latest = fuel.latest;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Fuel className="size-4 text-orange-500" />
          Latest fill performance
        </CardTitle>
        {latest ? (
          <Badge variant="secondary" className="font-normal">
            Last refill {fmtDate(latest.date)}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {done ? (
          <>
            <p className="text-sm text-muted-foreground">
              The <span className="font-medium text-foreground">{fmtLiters(done.liters)} L</span>{" "}
              bought for <span className="font-medium text-foreground">{fmtTaka(done.amount)}</span> on{" "}
              {fmtDate(done.date)} ran{" "}
              <span className="font-medium text-foreground">{fmtInt(done.distanceRun ?? 0)} km</span> over{" "}
              <span className="font-medium text-foreground">{fmtDays(done.daysRun).toLowerCase()}</span>.
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">
                {fmtKmpl(done.kmPerLiter)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">km per litre</span>
            </div>
            <div className="grid grid-cols-3 divide-x rounded-xl border bg-muted/40 py-3 text-center">
              <div className="space-y-0.5 px-3">
                <Route className="mx-auto size-4 text-sky-500" />
                <p className="text-sm font-semibold tabular-nums">
                  {fmtInt(done.distanceRun ?? 0)} km
                </p>
                <p className="text-xs text-muted-foreground">Distance run</p>
              </div>
              <div className="space-y-0.5 px-3">
                <CalendarClock className="mx-auto size-4 text-violet-500" />
                <p className="text-sm font-semibold tabular-nums">
                  {fmtDays(done.daysRun)}
                </p>
                <p className="text-xs text-muted-foreground">Days run</p>
              </div>
              <div className="space-y-0.5 px-3">
                <TrendingUp className="mx-auto size-4 text-emerald-500" />
                <p className="text-sm font-semibold tabular-nums">
                  {done.costPerKm !== null ? `৳${done.costPerKm.toFixed(2)}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Cost per km</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add the next refill to see how far this tank of fuel carries your
            bike.
          </p>
        )}

        {latest ? (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                Current tank: {fmtLiters(latest.liters)} L from {fmtDate(latest.date)}
                {latest.daysSince > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-foreground tabular-nums">
                      day {latest.daysSince + 1}
                    </span>{" "}
                    in progress
                  </>
                ) : (
                  <> · started today</>
                )}
              </p>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Running
              </Badge>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
