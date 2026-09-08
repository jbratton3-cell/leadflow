import "server-only";
import { randomBytes } from "crypto";
import { db, pool } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBaseUrl } from "@/lib/notify";

export function qbConfigured(): boolean {
  return Boolean(process.env.QB_CLIENT_ID && process.env.QB_CLIENT_SECRET);
}

export function qbRedirectUri(): string {
  return process.env.QB_REDIRECT_URI || `${getBaseUrl()}/api/quickbooks/callback`;
}

export function qbAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QB_CLIENT_ID ?? "",
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: qbRedirectUri(),
    state,
  });
  return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
}

export function newOAuthState(): string {
  return randomBytes(24).toString("hex");
}

let qbColsReady = false;
export async function ensureQbColumns() {
  if (qbColsReady) return;
  await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS qb_realm_id varchar(40)`);
  await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS qb_refresh_token text`);
  await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS qb_access_token text`);
  await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS qb_token_expires_at timestamp`);
  await pool.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS qb_connected_at timestamp`);
  qbColsReady = true;
}

type TokenJson = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function tokenRequest(body: URLSearchParams): Promise<TokenJson> {
  const id = process.env.QB_CLIENT_ID ?? "";
  const secret = process.env.QB_CLIENT_SECRET ?? "";
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  return (await res.json()) as TokenJson;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenJson> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: qbRedirectUri(),
    })
  );
}

export async function saveQbConnection(orgId: number, realmId: string, tokens: TokenJson) {
  await ensureQbColumns();
  const expires = new Date(Date.now() + Math.max((tokens.expires_in ?? 3600) - 60, 60) * 1000);
  await db
    .update(organizations)
    .set({
      qbRealmId: realmId,
      qbRefreshToken: tokens.refresh_token ?? null,
      qbAccessToken: tokens.access_token ?? null,
      qbTokenExpiresAt: expires,
      qbConnectedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

export async function disconnectQb(orgId: number) {
  await ensureQbColumns();
  await db
    .update(organizations)
    .set({
      qbRealmId: null,
      qbRefreshToken: null,
      qbAccessToken: null,
      qbTokenExpiresAt: null,
      qbConnectedAt: null,
    })
    .where(eq(organizations.id, orgId));
}
