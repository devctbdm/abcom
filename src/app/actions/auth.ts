"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE } from "@/lib/auth";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export type AuthState = {
  status: "idle" | "error";
  message: string;
};

function fail(message: string): AuthState {
  return { status: "error", message };
}

async function startSession(user: {
  id: number;
  email: string;
  role: "user" | "admin";
}) {
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/* ------------------------------------------------------------------ */
/*  Register — role is ALWAYS "user" (DB default). No role input.      */
/* ------------------------------------------------------------------ */

const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name.").max(80),
    email: z.email("Enter a valid email address.").max(120),
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

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existing.length > 0) {
      return fail("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    // NOTE: role is intentionally NOT settable here — the column
    // defaults to 'user'. Promote to 'admin' directly in the database.
    const [row] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    if (!row) return fail("Could not create the account. Please try again.");

    await startSession(row);
  } catch {
    return fail("Could not create the account. Please try again.");
  }

  redirect("/");
}

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

const loginSchema = z.object({
  email: z.email("Enter a valid email address.").max(120),
  password: z.string().min(1, "Enter your password.").max(100),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    if (!row) return fail("Wrong email or password.");

    const ok = await bcrypt.compare(parsed.data.password, row.passwordHash);
    if (!ok) return fail("Wrong email or password.");

    await startSession({ id: row.id, email: row.email, role: row.role });
  } catch {
    return fail("Could not sign you in. Please try again.");
  }

  redirect("/");
}

/* ------------------------------------------------------------------ */
/*  Logout                                                             */
/* ------------------------------------------------------------------ */

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
