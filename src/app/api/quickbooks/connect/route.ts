import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth";
import { qbAuthorizeUrl, qbConfigured, newOAuthState } from "@/lib/quickbooks";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAccess("settings");
  if (!qbConfigured()) {
    return NextResponse.redirect(new URL("/settings?qb=missing", process.env.NEXT_PUBLIC_APP_URL || "https://leadflowcrm.info"));
  }
  const state = newOAuthState();
  const res = NextResponse.redirect(qbAuthorizeUrl(state));
  res.cookies.set("qb_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("qb_oauth_org", String(user.orgId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
