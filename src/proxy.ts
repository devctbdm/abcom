import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const SESSION_COOKIE = "fuelride-session";
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Signed-in users should not see login/register.
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Everything else in the app requires a session.
  if (!session && !isAuthPage) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect every route except Next.js internals, the health check
     * and static assets.
     */
    "/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
