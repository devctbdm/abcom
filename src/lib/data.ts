import { db } from "@/db";
import {
  fuelLogs,
  maintenance,
  oilChanges,
  staff,
  vehicles,
  type FuelLogRow,
  type MaintenanceRow,
  type OilChangeRow,
  type StaffRow,
  type VehicleRow,
} from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import {
  computeFuelSummary,
  computeOilStatus,
  type OilStatus,
} from "@/lib/stats";

export async function getVehicles(): Promise<VehicleRow[]> {
  try {
    return await db.select().from(vehicles).orderBy(vehicles.id);
  } catch {
    return [];
  }
}

export async function getFuelLogs(
  vehicleId: number,
  startDate?: string,
  endDate?: string,
): Promise<FuelLogRow[]> {
  try {
    const conditions = [eq(fuelLogs.vehicleId, vehicleId)];

    if (startDate) {
      conditions.push(gte(fuelLogs.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(fuelLogs.date, endDate));
    }

    return await db
      .select()
      .from(fuelLogs)
      .where(and(...conditions))
      .orderBy(desc(fuelLogs.odometer));
  } catch {
    return [];
  }
}

export async function getOilChanges(
  vehicleId: number,
): Promise<OilChangeRow[]> {
  try {
    return await db
      .select()
      .from(oilChanges)
      .where(eq(oilChanges.vehicleId, vehicleId))
      .orderBy(desc(oilChanges.odometer));
  } catch {
    return [];
  }
}

export async function getMaintenance(
  vehicleId: number,
  startDate?: string,
  endDate?: string,
): Promise<MaintenanceRow[]> {
  try {
    const conditions = [eq(maintenance.vehicleId, vehicleId)];

    if (startDate) {
      conditions.push(gte(maintenance.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(maintenance.date, endDate));
    }

    return await db
      .select()
      .from(maintenance)
      .where(and(...conditions))
      .orderBy(desc(maintenance.date));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Fleet-wide overview                                                */
/* ------------------------------------------------------------------ */

export async function getStaff(): Promise<StaffRow[]> {
  try {
    return await db.select().from(staff).orderBy(staff.id);
  } catch {
    return [];
  }
}

/** Quick lookup of vehicle owners by staff id. */
export async function getStaffMap(): Promise<Map<number, StaffRow>> {
  const rows = await getStaff();
  return new Map(rows.map((row) => [row.id, row]));
}

export type StaffWithVehicles = {
  person: StaffRow;
  vehicles: VehicleRow[];
};

export async function getStaffWithVehicles(): Promise<StaffWithVehicles[]> {
  const [people, allVehicles] = await Promise.all([getStaff(), getVehicles()]);
  return people.map((person) => ({
    person,
    vehicles: allVehicles.filter((v) => v.ownerId === person.id),
  }));
}

export type FleetRow = {
  vehicle: VehicleRow;
  owner: StaffRow | null;
  currentOdometer: number;
  refills: number;
  totalSpent: number;
  totalLiters: number;
  avgKmPerLiter: number | null;
  oil: OilStatus;
};

export async function getFleetOverview(): Promise<FleetRow[]> {
  const [all, staffById] = await Promise.all([getVehicles(), getStaffMap()]);
  return Promise.all(
    all.map(async (vehicle) => {
      const [fuelRows, oilRows] = await Promise.all([
        getFuelLogs(vehicle.id),
        getOilChanges(vehicle.id),
      ]);
      const fuel = computeFuelSummary(fuelRows);
      const oil = computeOilStatus(
        oilRows,
        fuel.currentOdometer,
        vehicle.oilIntervalKm,
      );
      return {
        vehicle,
        owner:
          vehicle.ownerId !== null
            ? (staffById.get(vehicle.ownerId) ?? null)
            : null,
        currentOdometer: fuel.currentOdometer,
        refills: fuel.count,
        totalSpent: fuel.totalSpent,
        totalLiters: fuel.totalLiters,
        avgKmPerLiter: fuel.avgKmPerLiter,
        oil,
      };
    }),
  );
}
