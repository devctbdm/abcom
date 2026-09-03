import "server-only";

import { cookies } from "next/headers";
import { db } from "@/db";
import { users, type UserRole, type UserRow } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken } from "@/lib/session";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export const SESSION_COOKIE = "fuelride-session";

export function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

/** Read the signed session cookie and load the user from the database. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub));

    return row ? toSessionUser(row) : null;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}
