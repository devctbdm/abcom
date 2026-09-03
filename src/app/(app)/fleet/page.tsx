import { Bike, Car, CircleDollarSign, Fuel, Truck } from "lucide-react";

import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { OilStatusBadge } from "@/components/oil-status-card";
import { OpenVehicleButton } from "@/components/open-vehicle-button";
import { StatCard } from "@/components/stat-card";
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
import { OwnerSelect } from "@/components/owner-select";
import { deleteVehicle } from "@/app/actions/vehicles";
import { getFleetOverview, getStaff, getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { fmtInt, fmtKmpl, fmtTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const [allVehicles, fleet, people] = await Promise.all([
    getVehicles(),
    getFleetOverview(),
    getStaff(),
  ]);
  const activeId = await getActiveVehicleId(allVehicles);
  const autoOpen = sp.new === "1";

  const bikes = fleet.filter((r) => r.vehicle.category === "BIKE").length;
  const cars = fleet.filter((r) => r.vehicle.category === "CAR").length;
  const totalSpent = fleet.reduce((s, r) => s + r.totalSpent, 0);
  const totalLiters = fleet.reduce((s, r) => s + r.totalLiters, 0);
  const alerts = fleet.filter(
    (r) => r.oil.status === "due-soon" || r.oil.status === "overdue"
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Fleet Management
          </h1>
          <p className="text-sm text-muted-foreground">
            All company bikes and cars in one place — pick a vehicle to manage
            its fuel and mobil records.
          </p>
        </div>
        <AddVehicleDialog defaultOpen={autoOpen} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total vehicles"
          value={`${fleet.length}`}
          sub={`${bikes} bike${bikes === 1 ? "" : "s"} · ${cars} car${cars === 1 ? "" : "s"}`}
          icon={Truck}
          tone="sky"
        />
        <StatCard
          title="Fleet fuel spending"
          value={fmtTaka(totalSpent)}
          sub="All vehicles combined"
          icon={CircleDollarSign}
          tone="orange"
        />
        <StatCard
          title="Fleet fuel loaded"
          value={`${totalLiters.toFixed(2)} L`}
          sub={`${fleet.reduce((s, r) => s + r.refills, 0)} refills total`}
          icon={Fuel}
          tone="violet"
        />
        <StatCard
          title="Oil due alerts"
          value={`${alerts.length}`}
          sub={
            alerts.length > 0
              ? alerts.map((r) => r.vehicle.name).join(", ")
              : "Every vehicle is healthy"
          }
          icon={Bike}
          tone={alerts.length > 0 ? "rose" : "emerald"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company fleet</CardTitle>
          <CardDescription>
            Live fuel efficiency and mobil-drain status per vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fleet.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No vehicles registered yet. Add your first bike or car above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner / Rider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead className="text-right">Refills</TableHead>
                  <TableHead className="text-right">Fuel spent</TableHead>
                  <TableHead className="text-right">Fuel loaded</TableHead>
                  <TableHead className="text-right">Mileage</TableHead>
                  <TableHead>Mobil status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fleet.map((row) => {
                  const Icon = row.vehicle.category === "CAR" ? Car : Bike;
                  return (
                    <TableRow key={row.vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <Icon className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {row.vehicle.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {row.vehicle.regNo}
                              {row.vehicle.note ? ` · ${row.vehicle.note}` : ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <OwnerSelect
                            vehicleId={row.vehicle.id}
                            ownerId={row.vehicle.ownerId}
                            people={people}
                          />
                          {row.owner ? (
                            <span className="text-xs text-muted-foreground">
                              {row.owner.position}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {row.vehicle.category === "CAR" ? "Car" : "Bike"} ·{" "}
                          {row.vehicle.fuelType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.currentOdometer > 0
                          ? `${fmtInt(row.currentOdometer)} km`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.refills}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.totalSpent > 0 ? fmtTaka(row.totalSpent) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.totalLiters > 0
                          ? `${row.totalLiters.toFixed(2)} L`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtKmpl(row.avgKmPerLiter)} km/L
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <OilStatusBadge status={row.oil.status} />
                          {row.oil.hasChanges ? (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {fmtInt(row.oil.kmRemaining)} km left
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <OpenVehicleButton
                            id={row.vehicle.id}
                            active={row.vehicle.id === activeId}
                          />
                          <DeleteEntryButton
                            id={row.vehicle.id}
                            title={`Delete ${row.vehicle.name}?`}
                            description="This permanently removes the vehicle together with all of its fuel refills and oil changes."
                            onDelete={deleteVehicle}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
