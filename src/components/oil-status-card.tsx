import { CalendarClock, Droplets, History, Route } from "lucide-react";

import type { OilStatus } from "@/lib/stats";
import { fmtDate, fmtInt, fmtTaka } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function OilStatusBadge({ status }: { status: OilStatus["status"] }) {
  if (status === "ok")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        Healthy
      </Badge>
    );
  if (status === "due-soon")
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Due soon
      </Badge>
    );
  if (status === "overdue")
    return <Badge variant="destructive">Overdue</Badge>;
  return <Badge variant="secondary">No data</Badge>;
}

export function OilStatusCard({
  oil,
  id,
}: {
  oil: OilStatus;
  id?: string;
}) {
  const last = oil.lastChange;

  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Droplets className="size-4 text-sky-500" />
          Mobil (oil) status
        </CardTitle>
        <OilStatusBadge status={oil.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        {last ? (
          <>
            <p className="text-sm text-muted-foreground">
              Last drain:{" "}
              <span className="font-medium text-foreground">{last.oilName}</span>{" "}
              on {fmtDate(last.date)} at{" "}
              <span className="font-medium text-foreground tabular-nums">
                {fmtInt(last.odometer)} km
              </span>
              {last.amount !== null ? <> · {fmtTaka(last.amount)}</> : null}.
            </p>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {fmtInt(oil.kmRemaining)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    km left
                  </span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {oil.usagePercent}% of {fmtInt(oil.intervalKm)} km oil life used
                </span>
              </div>
              <Progress value={oil.usagePercent} />
              <p className="text-xs text-muted-foreground tabular-nums">
                Next drain due at{" "}
                <span className="font-medium text-foreground">
                  {fmtInt(oil.dueOdometer ?? 0)} km
                </span>{" "}
                odometer
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x rounded-xl border bg-muted/40 py-3 text-center">
              <div className="space-y-0.5 px-3">
                <Route className="mx-auto size-4 text-sky-500" />
                <p className="text-sm font-semibold tabular-nums">
                  {fmtInt(oil.kmSinceChange)} km
                </p>
                <p className="text-xs text-muted-foreground">Since drain</p>
              </div>
              <div className="space-y-0.5 px-3">
                <CalendarClock className="mx-auto size-4 text-violet-500" />
                <p className="text-sm font-semibold tabular-nums">
                  {oil.daysSinceChange} day{oil.daysSinceChange === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-muted-foreground">In engine</p>
              </div>
              <div className="space-y-0.5 px-3">
                <History className="mx-auto size-4 text-emerald-500" />
                <p className="text-sm font-semibold tabular-nums">
                  {oil.lastKmLasted !== null ? `${fmtInt(oil.lastKmLasted)} km` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last oil lasted</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No oil changes recorded yet. Log your first mobil drain to start
            tracking oil life.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
