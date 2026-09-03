import {
  CircleDollarSign,
  Download,
  Fuel,
  Gauge,
  TrendingUp,
} from "lucide-react";

import { AddFuelDialog } from "@/components/add-fuel-dialog";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { FuelTable } from "@/components/fuel-table";
import { FuelFilter } from "@/components/fuel-filter";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFuelLogs, getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { computeFuelSummary } from "@/lib/stats";
import { fmtInt, fmtKmpl, fmtTaka } from "@/lib/format";

function getDateRange(filter: string | undefined): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (filter) {
    case "current_month":
      return {
        startDate: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        endDate: `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`,
      };
    case "last_month":
      const lastMonth = new Date(year, month, 0);
      return {
        startDate: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`,
        endDate: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-${lastMonth.getDate()}`,
      };
    case "current_year":
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    case "last_year":
      return {
        startDate: `${year - 1}-01-01`,
        endDate: `${year - 1}-12-31`,
      };
    default:
      return {};
  }
}

export const dynamic = "force-dynamic";

export default async function FuelPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; filter?: string }>;
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
              Add a bike or car first, then you can log fuel refills.
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
  const vehicle = allVehicles.find((v) => v.id === activeId) ?? allVehicles[0];

  const { startDate, endDate } = getDateRange(sp.filter);
  const rows = await getFuelLogs(vehicle.id, startDate, endDate);
  const fuel = computeFuelSummary(rows);
  const autoOpen = sp.new === "1";

  const bestMileage = Math.max(
    ...fuel.chronological
      .filter((e) => e.kmPerLiter !== null)
      .map((e) => e.kmPerLiter ?? 0),
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Fuel Log</h1>
          <p className="text-sm text-muted-foreground">
            Every refill for {vehicle.name} — KM run, KM per litre and days per
            tank update automatically.
          </p>
        </div>
        <AddFuelDialog
          vehicleId={vehicle.id}
          defaultOpen={autoOpen}
          lastPricePerLiter={fuel.pricePerLiterLatest ?? 141}
          expectedOdometer={fuel.currentOdometer || 1000}
        />
      </div>

      <div
        id="stats"
        className="grid scroll-mt-20 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Average mileage"
          value={`${fmtKmpl(fuel.avgKmPerLiter)} km/L`}
          sub={
            bestMileage > 0
              ? `Best tank ${bestMileage.toFixed(1)} km/L`
              : undefined
          }
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          title="Fuel loaded"
          value={`${fuel.totalLiters.toFixed(2)} L`}
          sub={`${fuel.count} refills · avg ${fuel.avgFillLiters.toFixed(2)} L`}
          icon={Fuel}
          tone="violet"
        />
        <StatCard
          title="Fuel spending"
          value={fmtTaka(fuel.totalSpent)}
          sub={
            fuel.costPerKm !== null
              ? `৳${fuel.costPerKm.toFixed(2)} per km`
              : undefined
          }
          icon={CircleDollarSign}
          tone="orange"
        />
        <StatCard
          title="Distance tracked"
          value={`${fmtInt(fuel.distanceCovered)} km`}
          sub={
            fuel.avgDaysBetweenFills !== null
              ? `Refill every ${fuel.avgDaysBetweenFills.toFixed(1)} days`
              : undefined
          }
          icon={Gauge}
          tone="sky"
        />
      </div>

      {fuel.count === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No refills yet</CardTitle>
            <CardDescription>
              Add the first refill for {vehicle.name} to start tracking mileage.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Refill history</CardTitle>
                <CardDescription>
                  Newest first. Mileage of a fill is measured from its odometer
                  reading to the next one.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <FuelFilter />
                <form action="/api/export/fuel" method="POST">
                  <input type="hidden" name="vehicleId" value={vehicle.id} />
                  <input
                    type="hidden"
                    name="vehicleName"
                    value={vehicle.name}
                  />
                  {startDate && (
                    <input type="hidden" name="startDate" value={startDate} />
                  )}
                  {endDate && (
                    <input type="hidden" name="endDate" value={endDate} />
                  )}
                  <Button variant="outline" size="icon" type="submit">
                    <Download className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FuelTable entries={fuel.entries} showActions />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
