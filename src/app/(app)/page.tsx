import {
  ArrowRight,
  CircleDollarSign,
  Fuel,
  Gauge,
  TrendingUp,
} from "lucide-react";

import { AddFuelDialog } from "@/components/add-fuel-dialog";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { FuelTable } from "@/components/fuel-table";
import { LastFillCard } from "@/components/last-fill-card";
import { OilStatusCard } from "@/components/oil-status-card";
import { StatCard } from "@/components/stat-card";
import { MileageChart } from "@/components/charts/mileage-chart";
import { SpendChart } from "@/components/charts/spend-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFuelLogs, getOilChanges, getStaffMap, getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { computeFuelSummary, computeOilStatus } from "@/lib/stats";
import {
  fmtDateShort,
  fmtDays,
  fmtInt,
  fmtKmpl,
  fmtTaka,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allVehicles = await getVehicles();

  if (allVehicles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="items-center gap-3">
            <div className="rounded-2xl bg-orange-50 p-4 text-orange-500">
              <Fuel className="size-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">Set up your company fleet</CardTitle>
              <CardDescription>
                Add your first vehicle — a bike like the R15 or Apache, or a car
                like the BMW. Each vehicle gets its own fuel log, mileage stats
                and mobil drain reminders.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AddVehicleDialog defaultOpen />
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeId = await getActiveVehicleId(allVehicles);
  const vehicle =
    allVehicles.find((v) => v.id === activeId) ?? allVehicles[0];

  const [fuelRows, oilRows, staffById] = await Promise.all([
    getFuelLogs(vehicle.id),
    getOilChanges(vehicle.id),
    getStaffMap(),
  ]);
  const owner =
    vehicle.ownerId !== null ? staffById.get(vehicle.ownerId) ?? null : null;
  const fuel = computeFuelSummary(fuelRows);
  const oil = computeOilStatus(oilRows, fuel.currentOdometer, vehicle.oilIntervalKm);

  const mileageData = fuel.chronological
    .filter((e) => e.kmPerLiter !== null)
    .map((e) => ({
      label: fmtDateShort(e.date),
      kmpl: Number((e.kmPerLiter ?? 0).toFixed(1)),
      liters: e.liters,
      distance: e.distanceRun ?? 0,
      days: e.daysRun ?? 0,
    }));

  const spendData = fuel.chronological.map((e) => ({
    label: fmtDateShort(e.date),
    amount: e.amount,
    liters: e.liters,
    pricePerLiter: Number(e.pricePerLiter.toFixed(1)),
  }));

  if (fuel.count === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="items-center gap-3">
            <div className="rounded-2xl bg-orange-50 p-4 text-orange-500">
              <Fuel className="size-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">
                Start tracking {vehicle.name}
              </CardTitle>
              <CardDescription>
                Add the first fuel refill — money paid, litres and the odometer
                reading. FuelRide will compute KM per litre, days per tank and
                mobil (oil) drain reminders automatically.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AddFuelDialog
              vehicleId={vehicle.id}
              defaultOpen
              expectedOdometer={1000}
              lastPricePerLiter={141}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const bestMileage = Math.max(
    ...fuel.chronological
      .filter((e) => e.kmPerLiter !== null)
      .map((e) => e.kmPerLiter ?? 0),
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {vehicle.name}
            </h1>
            <Badge variant="secondary">
              {vehicle.category === "CAR" ? "Car" : "Bike"} · {vehicle.fuelType}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {owner ? (
              <>
                <span className="font-medium text-foreground">
                  {owner.name}
                </span>{" "}
                ({owner.position}) ·{" "}
              </>
            ) : null}
            {vehicle.regNo} · {fuel.count} refills across{" "}
            {fmtDays(fuel.trackingDays).toLowerCase()}
          </p>
        </div>
        <AddFuelDialog
          vehicleId={vehicle.id}
          lastPricePerLiter={fuel.pricePerLiterLatest ?? 141}
          expectedOdometer={fuel.currentOdometer}
        />
      </div>

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          id="stats-distance"
          title="Distance tracked"
          value={`${fmtInt(fuel.distanceCovered)} km`}
          sub={`Odometer at ${fmtInt(fuel.currentOdometer)} km`}
          icon={Gauge}
          tone="sky"
        />
        <StatCard
          id="stats-mileage"
          title="Average mileage"
          value={`${fmtKmpl(fuel.avgKmPerLiter)} km/L`}
          sub={bestMileage > 0 ? `Best ${bestMileage.toFixed(1)} km/L in one tank` : undefined}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          id="stats-spending"
          title="Fuel spending"
          value={fmtTaka(fuel.totalSpent)}
          sub={
            fuel.costPerKm !== null
              ? `৳${fuel.costPerKm.toFixed(2)} fuel cost per km`
              : undefined
          }
          icon={CircleDollarSign}
          tone="orange"
        />
        <StatCard
          title="Fuel loaded"
          value={`${fuel.totalLiters.toFixed(2)} L`}
          sub={`Avg refill ${fmtTaka(fuel.avgFillAmount)} · ${fuel.avgFillLiters.toFixed(2)} L`}
          icon={Fuel}
          tone="violet"
        />
      </div>

      {/* Latest fill + oil status */}
      <div className="grid gap-4 xl:grid-cols-2">
        <LastFillCard fuel={fuel} />
        <OilStatusCard oil={oil} id="mobil-status" />
      </div>

      {/* Charts */}
      <div id="charts" className="grid scroll-mt-20 gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Mileage per tank</CardTitle>
            <CardDescription>
              How many kilometres each refill ran per litre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MileageChart data={mileageData} average={fuel.avgKmPerLiter} />
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Fuel spending</CardTitle>
            <CardDescription>
              Taka paid per refill · avg ৳
              {fuel.avgPricePerLiter !== null
                ? fuel.avgPricePerLiter.toFixed(1)
                : "—"}
              /L
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpendChart data={spendData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent refills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Recent refills</CardTitle>
            <CardDescription>
              KM run, mileage and days run for the latest entries
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <a href="/fuel">
              View fuel log
              <ArrowRight />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <FuelTable entries={fuel.entries.slice(0, 6)} />
        </CardContent>
      </Card>
    </div>
  );
}
