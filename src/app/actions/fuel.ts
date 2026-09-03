"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fuelLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const fuelSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0.")
    .max(1_000_000, "Amount looks too large."),
  liters: z.coerce
    .number()
    .positive("Litres must be greater than 0.")
    .max(500, "Litres look too large."),
  odometer: z.coerce
    .number()
    .positive("Odometer must be greater than 0.")
    .max(10_000_000, "Odometer looks too large."),
  note: z.string().max(200, "Note is too long.").optional(),
});

function fail(error: string): ActionState {
  return { status: "error", message: error };
}

export async function createFuelLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = fuelSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    liters: formData.get("liters"),
    odometer: formData.get("odometer"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { vehicleId, date, amount, liters, odometer, note } = parsed.data;

  try {
    await db.insert(fuelLogs).values({
      vehicleId,
      date,
      amount: amount.toFixed(2),
      liters: liters.toFixed(3),
      odometer: odometer.toFixed(1),
      note: note?.trim() || null,
    });
  } catch {
    return fail("Could not save the fuel entry. Please try again.");
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Fuel entry saved." };
}

export async function deleteFuelLog(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  try {
    await db.delete(fuelLogs).where(eq(fuelLogs.id, id));
  } catch {
    return fail("Could not delete the fuel entry.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Fuel entry deleted." };
}
