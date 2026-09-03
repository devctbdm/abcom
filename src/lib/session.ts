import { SignJWT, jwtVerify } from "jose";

/**
 * Session signing secret. Set AUTH_SECRET in .env for production.
 * Edge-compatible (used by middleware) — no Node-only APIs here.
 */
const secretString =
  process.env.AUTH_SECRET ?? "fuelride-dev-secret-change-me-in-production";
const secret = new TextEncoder().encode(secretString);

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: number;
  email: string;
  role: "user" | "admin";
};

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = Number(payload.sub);
    if (!Number.isInteger(sub) || sub <= 0) return null;
    const role = payload.role === "admin" ? "admin" : "user";
    return { sub, email: String(payload.email ?? ""), role };
  } catch {
    return null;
  }
}
