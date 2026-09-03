import { Bike, Car, CircleDollarSign, IdCard, Phone, Users } from "lucide-react";

import { AddStaffDialog } from "@/components/add-staff-dialog";
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
import { Separator } from "@/components/ui/separator";
import { deleteStaff } from "@/app/actions/staff";
import { getFleetOverview, getStaffWithVehicles, getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { fmtInt, fmtKmpl, fmtTaka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const [people, fleet, allVehicles] = await Promise.all([
    getStaffWithVehicles(),
    getFleetOverview(),
    getVehicles(),
  ]);
  const activeId = await getActiveVehicleId(allVehicles);

  const byVehicleId = new Map(fleet.map((row) => [row.vehicle.id, row]));
  const unassigned = fleet.filter((row) => row.owner === null);
  const totalSpentAssigned = fleet
    .filter((row) => row.owner !== null)
    .reduce((s, row) => s + row.totalSpent, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Users & Bike Owners
          </h1>
          <p className="text-sm text-muted-foreground">
            Company staff with the vehicles assigned to them, and what each
            person costs in fuel.
          </p>
        </div>
        <AddStaffDialog vehicles={allVehicles} defaultOpen={sp.new === "1"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total users"
          value={`${people.length}`}
          sub="Registered employees"
          icon={Users}
          tone="violet"
        />
        <StatCard
          title="Assigned vehicles"
          value={`${fleet.length - unassigned.length} / ${fleet.length}`}
          sub={
            unassigned.length > 0
              ? `${unassigned.length} unassigned`
              : "All vehicles have an owner"
          }
          icon={IdCard}
          tone="sky"
        />
        <StatCard
          title="Assigned fuel cost"
          value={fmtTaka(totalSpentAssigned)}
          sub="Total spent by staff vehicles"
          icon={CircleDollarSign}
          tone="orange"
        />
        <StatCard
          title="Bikes / Cars"
          value={`${fleet.filter((r) => r.vehicle.category === "BIKE").length} / ${fleet.filter((r) => r.vehicle.category === "CAR").length}`}
          sub="Fleet composition"
          icon={Bike}
          tone="emerald"
        />
      </div>

      {people.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No users yet</CardTitle>
            <CardDescription>
              Add your first employee — for example Md Minarul Islam (Manager)
              with the Honda CG 125.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {people.map(({ person, vehicles: owned }) => {
            const spent = owned.reduce(
              (s, v) => s + (byVehicleId.get(v.id)?.totalSpent ?? 0),
              0
            );
            const initials = person.name
              .split(" ")
              .map((p) => p.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={person.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-600">
                      {initials}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{person.name}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{person.position}</Badge>
                        {person.phone ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Phone className="size-3" />
                            {person.phone}
                          </span>
                        ) : null}
                      </CardDescription>
                    </div>
                  </div>
                  <DeleteEntryButton
                    id={person.id}
                    title={`Delete ${person.name}?`}
                    description="The user is removed. Their vehicles stay in the fleet but become unassigned."
                    onDelete={deleteStaff}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {owned.length} vehicle{owned.length === 1 ? "" : "s"}{" "}
                      assigned
                    </span>
                    <span className="font-medium tabular-nums">
                      {fmtTaka(spent)} fuel
                    </span>
                  </div>
                  <Separator />
                  {owned.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No vehicle assigned yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {owned.map((vehicle) => {
                        const row = byVehicleId.get(vehicle.id);
                        const Icon = vehicle.category === "CAR" ? Car : Bike;
                        return (
                          <div
                            key={vehicle.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="rounded-md bg-background p-1.5">
                                <Icon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {vehicle.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {vehicle.regNo}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-medium tabular-nums">
                                  {fmtKmpl(row?.avgKmPerLiter ?? null)} km/L
                                </p>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  {row ? fmtInt(row.currentOdometer) : 0} km
                                </p>
                              </div>
                              {row ? (
                                <OilStatusBadge status={row.oil.status} />
                              ) : null}
                              <OpenVehicleButton
                                id={vehicle.id}
                                active={vehicle.id === activeId}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
