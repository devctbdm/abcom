"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { staff, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ActionState } from "./fuel";

const staffSchema = z.object({
  name: z.string().min(2, "Full name is required.").max(80, "Name is too long."),
  position: z
    .string()
    .min(2, "Position is required.")
    .max(60, "Position is too long."),
  phone: z.string().max(30, "Phone is too long.").optional(),
  note: z.string().max(200, "Note is too long.").optional(),
  vehicleId: z.coerce.number().int().nonnegative().optional(),
});

function fail(message: string): ActionState {
  return { status: "error", message };
}

export async function createStaff(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawVehicle = formData.get("vehicleId");

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
    phone: formData.get("phone") || undefined,
    note: formData.get("note") || undefined,
    vehicleId:
      rawVehicle === "" || rawVehicle === null || rawVehicle === "0"
        ? undefined
        : rawVehicle,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { name, position, phone, note, vehicleId } = parsed.data;

  try {
    const [row] = await db
      .insert(staff)
      .values({
        name: name.trim(),
        position: position.trim(),
        phone: phone?.trim() || null,
        note: note?.trim() || null,
      })
      .returning({ id: staff.id });

    if (row && vehicleId) {
      await db
        .update(vehicles)
        .set({ ownerId: row.id })
        .where(eq(vehicles.id, vehicleId));
    }
  } catch {
    return fail("Could not save the user. Please try again.");
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "User added." };
}

export async function deleteStaff(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid user.");
  try {
    // Vehicles stay in the fleet, they just become unassigned.
    await db
      .update(vehicles)
      .set({ ownerId: null })
      .where(eq(vehicles.ownerId, id));
    await db.delete(staff).where(eq(staff.id, id));
  } catch {
    return fail("Could not delete the user.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "User deleted." };
}

/** Assign (or clear, with ownerId = 0) the owner of a vehicle. */
export async function assignVehicleOwner(
  vehicleId: number,
  ownerId: number
): Promise<ActionState> {
  if (!Number.isInteger(vehicleId) || vehicleId <= 0)
    return fail("Invalid vehicle.");
  try {
    await db
      .update(vehicles)
      .set({ ownerId: ownerId > 0 ? ownerId : null })
      .where(eq(vehicles.id, vehicleId));
  } catch {
    return fail("Could not update the assignment.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Assignment updated." };
}
