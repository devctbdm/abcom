"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { oilChanges } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ActionState } from "./fuel";

const oilSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  odometer: z.coerce
    .number()
    .int("Odometer must be a whole number.")
    .positive("Odometer must be greater than 0.")
    .max(10_000_000, "Odometer looks too large."),
  oilName: z.string().min(2, "Oil name is required.").max(80, "Too long."),
  amount: z.coerce.number().min(0).max(1_000_000).optional(),
  quantity: z.coerce.number().min(0).max(50).optional(),
  note: z.string().max(200, "Note is too long.").optional(),
});

function fail(message: string): ActionState {
  return { status: "error", message };
}

export async function createOilChange(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawAmount = formData.get("amount");
  const rawQuantity = formData.get("quantity");

  const parsed = oilSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    date: formData.get("date"),
    odometer: formData.get("odometer"),
    oilName: formData.get("oilName"),
    amount: rawAmount === "" || rawAmount === null ? undefined : rawAmount,
    quantity:
      rawQuantity === "" || rawQuantity === null ? undefined : rawQuantity,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { vehicleId, date, odometer, oilName, amount, quantity, note } =
    parsed.data;

  try {
    await db.insert(oilChanges).values({
      vehicleId,
      date,
      odometer,
      oilName: oilName.trim(),
      amount: amount === undefined ? null : amount.toFixed(2),
      quantity: quantity === undefined ? null : quantity.toFixed(3),
      note: note?.trim() || null,
    });
  } catch {
    return fail("Could not save the oil change. Please try again.");
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Oil change saved." };
}

export async function deleteOilChange(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  try {
    await db.delete(oilChanges).where(eq(oilChanges.id, id));
  } catch {
    return fail("Could not delete the oil change.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Oil change deleted." };
}
