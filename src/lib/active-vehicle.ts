import { cookies } from "next/headers";
import type { VehicleRow } from "@/db/schema";

export const ACTIVE_VEHICLE_COOKIE = "fuelride-active-vehicle";

/**
 * Resolve which vehicle the admin is currently managing.
 * Falls back to the first vehicle when the cookie is missing or stale.
 */
export async function getActiveVehicleId(
  vehicles: VehicleRow[]
): Promise<number> {
  const first = vehicles[0]?.id ?? 0;
  try {
    const store = await cookies();
    const raw = store.get(ACTIVE_VEHICLE_COOKIE)?.value;
    const id = Number(raw);
    if (Number.isInteger(id) && vehicles.some((v) => v.id === id)) return id;
  } catch {
    // cookies unavailable (e.g. outside request scope) — use default
  }
  return first;
}
