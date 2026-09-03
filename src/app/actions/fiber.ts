"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fiberClients, fiberPurchases, fiberUsages } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ActionState } from "./fuel";

function fail(message: string): ActionState {
  return { status: "error", message };
}

/* ------------------------------------------------------------------ */
/*  Purchases (fiber drums)                                            */
/* ------------------------------------------------------------------ */

const purchaseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  brand: z.string().min(1, "Brand is required.").max(40),
  core: z.coerce
    .number()
    .int()
    .min(1, "Core count must be at least 1.")
    .max(144, "Core count looks too large."),
  code: z.string().min(1, "Code is required.").max(20),
  lengthM: z.coerce
    .number()
    .positive("Length must be greater than 0 m.")
    .max(100_000, "Length looks too large."),
  amount: z.coerce.number().min(0).max(10_000_000).optional(),
  note: z.string().max(200, "Note is too long.").optional(),
});

export async function createFiberPurchase(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawAmount = formData.get("amount");
  const parsed = purchaseSchema.safeParse({
    date: formData.get("date"),
    brand: formData.get("brand"),
    core: formData.get("core"),
    code: formData.get("code"),
    lengthM: formData.get("lengthM"),
    amount: rawAmount === "" || rawAmount === null ? undefined : rawAmount,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const { date, brand, core, code, lengthM, amount, note } = parsed.data;

  try {
    await db.insert(fiberPurchases).values({
      date,
      brand: brand.trim(),
      core,
      code: code.trim().toUpperCase(),
      lengthM: lengthM.toFixed(2),
      amount: amount === undefined ? null : amount.toFixed(2),
      note: note?.trim() || null,
    });
  } catch {
    return fail("Could not save the purchase. Please try again.");
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Fiber purchase saved." };
}

export async function deleteFiberPurchase(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid purchase.");
  try {
    await db.delete(fiberPurchases).where(eq(fiberPurchases.id, id));
  } catch {
    return fail("Could not delete the purchase.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Purchase deleted." };
}

/* ------------------------------------------------------------------ */
/*  Clients                                                            */
/* ------------------------------------------------------------------ */

export async function deleteFiberClient(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid client.");
  try {
    await db.delete(fiberClients).where(eq(fiberClients.id, id));
  } catch {
    return fail("Could not delete the client.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Client deleted." };
}

/* ------------------------------------------------------------------ */
/*  Usages — smart FIFO assignment + stock guard                       */
/* ------------------------------------------------------------------ */

const usageSchema = z.object({
  meters: z.coerce
    .number()
    .positive("Meters must be greater than 0.")
    .max(50_000, "Meters look too large."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  note: z.string().max(200, "Note is too long.").optional(),
});

export async function createFiberUsage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = usageSchema.safeParse({
    meters: formData.get("meters"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { meters, date, note } = parsed.data;

  // ---- resolve client: existing id, or brand-new client --------------
  const clientRaw = String(formData.get("clientId") ?? "");
  let clientId: number;

  if (clientRaw === "__new__") {
    const newCode = String(formData.get("newClientId") ?? "").trim();
    const newName = String(formData.get("newClientName") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+$/.test(newCode)) {
      return fail("Client ID must look like user@zone (e.g. razzak@ptap).");
    }
    const [user, zone] = newCode.split("@");
    const existing = await db
      .select()
      .from(fiberClients)
      .where(eq(fiberClients.clientId, newCode));
    if (existing.length > 0) {
      return fail(`Client "${newCode}" already exists — pick them from the list.`);
    }
    const [row] = await db
      .insert(fiberClients)
      .values({
        clientId: newCode,
        name: newName || user,
        zone: zone || null,
        phone: String(formData.get("newClientPhone") ?? "").trim() || null,
      })
      .returning({ id: fiberClients.id });
    if (!row) return fail("Could not create the client.");
    clientId = row.id;
  } else {
    const id = Number(clientRaw);
    if (!Number.isInteger(id) || id <= 0) return fail("Pick a client.");
    clientId = id;
  }

  // ---- resolve drum: explicit pick or FIFO (oldest stock first) -------
  const purchaseRaw = String(formData.get("purchaseId") ?? "0");
  const explicitId = Number(purchaseRaw);

  const purchaseRows = await db.select().from(fiberPurchases);
  const usageRows = await db.select().from(fiberUsages);

  const usedByPurchase = new Map<number, number>();
  for (const u of usageRows) {
    if (u.purchaseId !== null) {
      usedByPurchase.set(
        u.purchaseId,
        (usedByPurchase.get(u.purchaseId) ?? 0) + Number(u.meters)
      );
    }
  }
  const drums = purchaseRows
    .map((p) => ({
      id: p.id,
      remaining: Number(p.lengthM) - (usedByPurchase.get(p.id) ?? 0),
      date: p.date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  let purchaseId: number | null = null;

  if (Number.isInteger(explicitId) && explicitId > 0) {
    const drum = drums.find((d) => d.id === explicitId);
    if (!drum) return fail("That drum no longer exists.");
    if (meters > drum.remaining) {
      return fail(
        `Not enough on that drum — only ${drum.remaining.toFixed(0)} m left. Pick another drum or buy new fiber.`
      );
    }
    purchaseId = explicitId;
  } else {
    // FIFO: oldest drum that still has enough meters
    const fit = drums.find((d) => d.remaining >= meters);
    if (!fit) {
      const totalLeft = drums.reduce((s, d) => s + Math.max(0, d.remaining), 0);
      if (totalLeft < meters) {
        return fail(
          `Out of stock — only ${totalLeft.toFixed(0)} m left in total. Buy a new fiber drum first.`
        );
      }
      return fail(
        `No single drum has ${meters} m left (total left: ${totalLeft.toFixed(0)} m). Split the usage or buy new fiber.`
      );
    }
    purchaseId = fit.id;
  }

  try {
    await db.insert(fiberUsages).values({
      clientId,
      purchaseId,
      date,
      meters: meters.toFixed(2),
      note: note?.trim() || null,
    });
  } catch {
    return fail("Could not save the usage. Please try again.");
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Fiber usage logged." };
}

export async function deleteFiberUsage(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid usage entry.");
  try {
    await db.delete(fiberUsages).where(eq(fiberUsages.id, id));
  } catch {
    return fail("Could not delete the usage entry.");
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Usage entry deleted." };
}
