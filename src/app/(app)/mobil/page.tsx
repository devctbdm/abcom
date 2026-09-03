import { CalendarClock, CircleDollarSign, Droplets, Route } from "lucide-react";

import { AddOilDialog } from "@/components/add-oil-dialog";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { OilStatusCard, OilStatusBadge } from "@/components/oil-status-card";
import { StatCard } from "@/components/stat-card";
import { OilChart } from "@/components/charts/oil-chart";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteOilChange } from "@/app/actions/oil";
import { getFuelLogs, getOilChanges, getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { computeFuelSummary, computeOilStatus } from "@/lib/stats";
import { fmtDate, fmtDateShort, fmtInt, fmtTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MobilPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const allVehicles = await getVehicles();

  if (allVehicles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-xl">No vehicles yet</CardTitle>
            <CardDescription>
              Add a bike or car first, then you can log mobil drains.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AddVehicleDialog />
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeId = await getActiveVehicleId(allVehicles);
  const vehicle =
    allVehicles.find((v) => v.id === activeId) ?? allVehicles[0];

  const [fuelRows, oilRows] = await Promise.all([
    getFuelLogs(vehicle.id),
    getOilChanges(vehicle.id),
  ]);
  const fuel = computeFuelSummary(fuelRows);
  const oil = computeOilStatus(
    oilRows,
    fuel.currentOdometer,
    vehicle.oilIntervalKm
  );
  const autoOpen = sp.new === "1";

  const chartData = [...oil.history]
    .reverse()
    .filter((e) => e.kmLasted !== null)
    .map((e) => ({
      label: fmtDateShort(e.date),
      km: e.kmLasted ?? 0,
      oil: e.oilName,
      days: e.daysLasted ?? 0,
    }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Mobil (Oil) Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Engine-oil drains for {vehicle.name} — change every{" "}
            {fmtInt(oil.intervalKm)} km.
          </p>
        </div>
        <AddOilDialog
          vehicleId={vehicle.id}
          defaultOpen={autoOpen}
          expectedOdometer={fuel.currentOdometer || oil.lastChange?.odometer}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="KM since drain"
          value={`${fmtInt(oil.kmSinceChange)} km`}
          sub={oil.lastChange ? `Since ${fmtDate(oil.lastChange.date)}` : undefined}
          icon={Route}
          tone="sky"
        />
        <StatCard
          title="KM until next drain"
          value={`${fmtInt(oil.kmRemaining)} km`}
          sub={oil.dueOdometer ? `Due at ${fmtInt(oil.dueOdometer)} km odometer` : undefined}
          icon={Droplets}
          tone="emerald"
        />
        <StatCard
          title="Days in engine"
          value={`${oil.daysSinceChange} day${oil.daysSinceChange === 1 ? "" : "s"}`}
          sub={oil.lastChange ? oil.lastChange.oilName : undefined}
          icon={CalendarClock}
          tone="violet"
        />
        <StatCard
          title="Oil spending"
          value={fmtTaka(oil.totalSpent)}
          sub={`${oil.history.length} oil change${oil.history.length === 1 ? "" : "s"} logged`}
          icon={CircleDollarSign}
          tone="orange"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <OilStatusCard oil={oil} id="status" />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Oil life per change</CardTitle>
            <CardDescription>
              How many kilometres each oil lasted before draining
            </CardDescription>
          </CardHeader>
          <CardContent>
            {oil.history.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Log your first oil change to start tracking.
              </div>
            ) : (
              <OilChart data={chartData} intervalKm={oil.intervalKm} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="history" className="scroll-mt-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Oil change history</CardTitle>
            <CardDescription>
              Each drain with the KM and days the previous oil lasted
            </CardDescription>
          </div>
          <OilStatusBadge status={oil.status} />
        </CardHeader>
        <CardContent>
          {oil.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No oil changes recorded for {vehicle.name} yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead>Engine oil</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Previous oil ran</TableHead>
                  <TableHead className="text-right">Days used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {oil.history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {fmtDate(entry.date)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtInt(entry.odometer)} km
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{entry.oilName}</span>
                        {entry.quantity !== null ? (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {entry.quantity.toFixed(2)} L
                            {entry.note ? ` · ${entry.note}` : ""}
                          </span>
                        ) : entry.note ? (
                          <span className="text-xs text-muted-foreground">
                            {entry.note}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {entry.amount !== null ? fmtTaka(entry.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.kmLasted !== null
                        ? `${fmtInt(entry.kmLasted)} km`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.daysLasted !== null
                        ? `${entry.daysLasted} day${entry.daysLasted === 1 ? "" : "s"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {entry.isLatest ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          In engine
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Drained</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DeleteEntryButton
                        id={entry.id}
                        title="Delete this oil change?"
                        description={`${entry.oilName} from ${fmtDate(entry.date)} will be removed permanently.`}
                        onDelete={deleteOilChange}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
