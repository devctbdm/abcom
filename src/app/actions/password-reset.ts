"use server";

import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";

export type PasswordResetState = {
  status: "idle" | "success" | "error";
  message: string;
};

const TOKEN_TTL_MINUTES = 60;

function fail(message: string): PasswordResetState {
  return { status: "error", message };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Build the public base URL from the incoming request headers. */
async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/* ------------------------------------------------------------------ */
/*  Step 1 — request a reset link                                      */
/* ------------------------------------------------------------------ */

const requestSchema = z.object({
  email: z.email("Enter a valid email address.").max(120),
});

export async function requestPasswordResetAction(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const parsed = requestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // Never reveal whether the account exists.
    if (!user) {
      return {
        status: "success",
        message: "If an account exists for that email, a reset link has been sent.",
      };
    }

    // Invalidate any previous outstanding tokens for this user.
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt,
    });

    const resetUrl = `${await getBaseUrl()}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      // Clean up so the user can immediately try again.
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, sha256(token)));
      console.error("[password-reset] email failed:", error);
      return fail(
        "Could not send the email right now. Please try again in a moment."
      );
    }
  } catch (error) {
    console.error("[password-reset] request failed:", error);
    return fail("Something went wrong. Please try again.");
  }

  return {
    status: "success",
    message: "If an account exists for that email, a reset link has been sent.",
  };
}

/* ------------------------------------------------------------------ */
/*  Step 2 — set a new password with the token                         */
/* ------------------------------------------------------------------ */

const resetSchema = z
  .object({
    token: z.string().min(16, "Invalid reset link."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .max(100, "Password is too long."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export async function resetPasswordAction(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const tokenHash = sha256(parsed.data.token);

  try {
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!row) {
      return fail("This reset link is invalid or has expired. Request a new one.");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, row.userId));

    // Single-use: consume the token.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));
  } catch (error) {
    console.error("[password-reset] reset failed:", error);
    return fail("Something went wrong. Please try again.");
  }

  redirect("/login?reset=1");
}
