import { CircleDollarSign, Download, Wrench, TrendingUp } from "lucide-react";

import { AddMaintenanceDialog } from "@/components/add-maintenance-dialog";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { MaintenanceTable } from "@/components/maintenance-table";
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
import { getMaintenance, getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { fmtTaka } from "@/lib/format";

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

export default async function MaintenancePage({
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
              Add a bike or car first, then you can log maintenance records.
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
  const rows = await getMaintenance(vehicle.id, startDate, endDate);
  const autoOpen = sp.new === "1";

  const totalSpent = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const partsCount = rows.filter((r) => r.type === "PARTS").length;
  const serviceCount = rows.filter((r) => r.type === "SERVICE").length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Track parts bills and service bills for {vehicle.name} with date,
            time, and cost details.
          </p>
        </div>
        <AddMaintenanceDialog vehicleId={vehicle.id} defaultOpen={autoOpen} />
      </div>

      <div
        id="stats"
        className="grid scroll-mt-20 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total spent"
          value={fmtTaka(totalSpent)}
          sub={`${rows.length} records`}
          icon={CircleDollarSign}
          tone="orange"
        />
        <StatCard
          title="Parts purchases"
          value={partsCount.toString()}
          sub="Parts bills"
          icon={Wrench}
          tone="violet"
        />
        <StatCard
          title="Service bills"
          value={serviceCount.toString()}
          sub="Service records"
          icon={TrendingUp}
          tone="rose"
        />
        <StatCard
          title="Average cost"
          value={rows.length > 0 ? fmtTaka(totalSpent / rows.length) : "৳0"}
          sub="Per record"
          icon={CircleDollarSign}
          tone="sky"
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              No maintenance records yet
            </CardTitle>
            <CardDescription>
              Add the first maintenance record for {vehicle.name} to start
              tracking costs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Maintenance history</CardTitle>
                <CardDescription>
                  Newest first. Track all parts and service expenses.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <FuelFilter />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MaintenanceTable entries={rows} showActions />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
