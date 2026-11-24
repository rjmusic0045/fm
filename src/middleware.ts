import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth-secret";

// Pages that require a signed-in user.
const PROTECTED = ["/dashboard", "/onboarding", "/settings", "/library", "/billing", "/admin", "/submissions"];
// Pages that only make sense for guests.
const GUEST_ONLY = ["/login", "/signup"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: authSecret() });
  const signedIn = Boolean(token?.id && (!token.sessionExpiresAt || token.sessionExpiresAt > Date.now()));

  if (matches(pathname, PROTECTED) && !signedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Send fresh accounts through onboarding before the app.
  if (signedIn && token?.onboarded === false && matches(pathname, ["/dashboard", "/library", "/settings"])) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Keep error pages reachable (OAuth failures land on /login?error=...).
  if (matches(pathname, GUEST_ONLY) && signedIn && !req.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL(token?.onboarded === false ? "/onboarding" : "/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/library/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/submissions/:path*",
    "/login",
    "/signup",
  ],
};
