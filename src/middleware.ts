import { NextResponse, type NextRequest } from "next/server";

// Note: /signup still works (kept as a back-pocket link for negotiations) but is
// intentionally not advertised anywhere on the public marketing pages.
const PUBLIC_PATHS = ["/login", "/signup", "/tour", "/invite", "/estimate", "/invoice", "/pricing", "/contact", "/api/health", "/api/email-check", "/api/jmb-contact", "/sw.js", "/icons"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS preflight for the public JMB contact endpoint (Next auto-handles
  // OPTIONS in route handlers, so the preflight must be answered here).
  if (req.method === "OPTIONS" && pathname === "/api/jmb-contact") {
    const origin = req.headers.get("origin") ?? "";
    if (origin === "https://jmbcreative.org" || origin === "https://www.jmbcreative.org") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

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
