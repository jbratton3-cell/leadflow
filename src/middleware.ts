import { NextResponse, type NextRequest } from "next/server";

// Note: /signup still works (kept as a back-pocket link for negotiations) but is
// intentionally not advertised anywhere on the public marketing pages.
const PUBLIC_PATHS = ["/login", "/signup", "/invite", "/estimate", "/pricing", "/contact", "/api/health", "/sw.js"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Expose the current path to server components (used by the root layout).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // "/" (landing) and "/pricing" are public marketing pages.
  const isPublic =
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = Boolean(req.cookies.get("session")?.value);

  // No session cookie and trying to reach a protected page → send to login.
  if (!isPublic && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already logged in but visiting /login or /signup → send to dashboard.
  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:png|jpg|jpeg|svg|ico)).*)",
  ],
};
