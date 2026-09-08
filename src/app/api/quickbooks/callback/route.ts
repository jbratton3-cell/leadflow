import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, saveQbConnection } from "@/lib/quickbooks";

export const dynamic = "force-dynamic";

function settingsUrl(query: string) {
  const base = process.env.QB_REDIRECT_URI
    ? new URL(process.env.QB_REDIRECT_URI).origin
    : "https://leadflowcrm.info";
  return `${base}/settings?${query}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const jar = await cookies();
  const expected = jar.get("qb_oauth_state")?.value;
  const orgRaw = jar.get("qb_oauth_org")?.value;
  jar.delete("qb_oauth_state");
  jar.delete("qb_oauth_org");

  if (err) return NextResponse.redirect(settingsUrl("qb=denied"));
  if (!code || !realmId || !state || !expected || state !== expected || !orgRaw) {
    return NextResponse.redirect(settingsUrl("qb=failed"));
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(settingsUrl("qb=failed"));
  }

  await saveQbConnection(Number(orgRaw), realmId, tokens);
  return NextResponse.redirect(settingsUrl("qb=ok"));
}
