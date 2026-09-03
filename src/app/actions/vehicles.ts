"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db";
import { fuelLogs, oilChanges, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ActionState } from "./fuel";
import { ACTIVE_VEHICLE_COOKIE } from "@/lib/active-vehicle";

const vehicleSchema = z.object({
  name: z.string().min(2, "Vehicle name is required.").max(80, "Too long."),
  category: z.enum(["BIKE", "CAR"], "Pick bike or car."),
  regNo: z.string().min(1, "Registration number is required.").max(60),
  fuelType: z.enum(["Petrol", "Octane", "Diesel", "CNG"], "Pick a fuel type."),
  oilIntervalKm: z.coerce
    .number()
    .int()
    .min(500, "Too small — minimum 500 km.")
    .max(50_000, "Too large."),
  note: z.string().max(200, "Note is too long.").optional(),
});

function fail(message: string): ActionState {
  return { status: "error", message };
}

export async function createVehicle(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = vehicleSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    regNo: formData.get("regNo"),
    fuelType: formData.get("fuelType"),
    oilIntervalKm: formData.get("oilIntervalKm"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { name, category, regNo, fuelType, oilIntervalKm, note } = parsed.data;

  let newId: number | null = null;
  try {
    const [row] = await db
      .insert(vehicles)
      .values({
        name: name.trim(),
        category,
        regNo: regNo.trim(),
        fuelType,
        oilIntervalKm,
        note: note?.trim() || null,
      })
      .returning({ id: vehicles.id });
    newId = row?.id ?? null;
  } catch {
    return fail("Could not save the vehicle. Please try again.");
  }

  // Switch the active workspace to the new vehicle right away.
  if (newId) {
    const store = await cookies();
    store.set(ACTIVE_VEHICLE_COOKIE, String(newId), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Vehicle added." };
}

export async function deleteVehicle(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid vehicle.");
  try {
    await db.delete(fuelLogs).where(eq(fuelLogs.vehicleId, id));
    await db.delete(oilChanges).where(eq(oilChanges.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
  } catch {
    return fail("Could not delete the vehicle.");
  }

  try {
    const store = await cookies();
    if (store.get(ACTIVE_VEHICLE_COOKIE)?.value === String(id)) {
      store.delete(ACTIVE_VEHICLE_COOKIE);
    }
  } catch {
    // non-fatal
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Vehicle deleted." };
}

export async function setActiveVehicle(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  const store = await cookies();
  store.set(ACTIVE_VEHICLE_COOKIE, String(id), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
