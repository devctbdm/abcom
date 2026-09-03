"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { maintenance } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const maintenanceSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  type: z.enum(["PARTS", "SERVICE"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  time: z.string().optional(),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(200, "Description is too long."),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0.")
    .max(1_000_000, "Amount looks too large."),
  shopName: z.string().max(100, "Shop name is too long.").optional(),
  note: z.string().max(200, "Note is too long.").optional(),
});

function fail(error: string): ActionState {
  return { status: "error", message: error };
}

export async function createMaintenance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = maintenanceSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    type: formData.get("type"),
    date: formData.get("date"),
    time: formData.get("time") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    shopName: formData.get("shopName") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { vehicleId, type, date, time, description, amount, shopName, note } =
    parsed.data;

  try {
    // Combine date and time if time is provided
    let timestamp: Date | null = null;
    if (time) {
      const [hours, minutes] = time.split(":").map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes, 0, 0);
      timestamp = dateTime;
    }

    await db.insert(maintenance).values({
      vehicleId,
      type,
      date,
      time: timestamp,
      description: description.trim(),
      amount: amount.toFixed(2),
      shopName: shopName?.trim() || null,
      note: note?.trim() || null,
    });
  } catch (error) {
    console.error("Maintenance insert error:", error);
    return fail("Could not save the maintenance entry. Please try again.");
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Maintenance entry saved." };
}

export async function deleteMaintenance(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  try {
    await db.delete(maintenance).where(eq(maintenance.id, id));
  } catch {
    return fail("Could not delete the maintenance entry.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Maintenance entry deleted." };
}
