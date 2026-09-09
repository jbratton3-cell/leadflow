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
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qb_invoice_id varchar(40)`);
  qbColsReady = true;
}

type TokenJson = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function qbApiBase(): string {
  const env = (process.env.QB_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

async function refreshTokens(refreshToken: string): Promise<TokenJson> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

export async function getQbAccess(orgId: number): Promise<{
  token: string;
  realmId: string;
} | null> {
  await ensureQbColumns();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org?.qbRealmId || !org.qbRefreshToken) return null;

  let access = org.qbAccessToken;
  const exp = org.qbTokenExpiresAt ? new Date(org.qbTokenExpiresAt).getTime() : 0;
  if (!access || Date.now() > exp - 30_000) {
    const tokens = await refreshTokens(org.qbRefreshToken);
    if (!tokens.access_token) return null;
    access = tokens.access_token;
    await saveQbConnection(orgId, org.qbRealmId, {
      ...tokens,
      refresh_token: tokens.refresh_token || org.qbRefreshToken,
    });
  }
  return { token: access, realmId: org.qbRealmId };
}

export async function qbQuery<T>(orgId: number, query: string): Promise<T | null> {
  const creds = await getQbAccess(orgId);
  if (!creds) return null;
  const url = `${qbApiBase()}/v3/company/${creds.realmId}/query?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${creds.token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function qbPost<T>(orgId: number, path: string, body: unknown): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const creds = await getQbAccess(orgId);
  if (!creds) return { ok: false, data: null, error: "QuickBooks is not connected." };
  const url = `${qbApiBase()}/v3/company/${creds.realmId}/${path}?minorversion=75`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { Fault?: { Error?: { Message?: string }[] } };
  if (!res.ok) {
    const msg = data?.Fault?.Error?.[0]?.Message || `QuickBooks error ${res.status}`;
    return { ok: false, data: null, error: msg };
  }
  return { ok: true, data };
}

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
