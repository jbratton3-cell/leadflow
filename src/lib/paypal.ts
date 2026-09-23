import "server-only";

import { pool } from "@/db";

export type PayPalMode = "sandbox" | "live";

export type PayPalMoney = {
  currency_code: string;
  value: string;
};

export type PayPalCapture = {
  id: string;
  status: string;
  amount?: PayPalMoney;
  custom_id?: string;
  seller_receivable_breakdown?: {
    gross_amount?: PayPalMoney;
    paypal_fee?: PayPalMoney;
    net_amount?: PayPalMoney;
  };
  supplementary_data?: {
    related_ids?: { order_id?: string };
  };
};

export type PayPalOrder = {
  id: string;
  status: string;
  payer?: {
    payer_id?: string;
    email_address?: string;
  };
  payment_source?: Record<string, unknown>;
  purchase_units?: Array<{
    custom_id?: string;
    reference_id?: string;
    amount?: PayPalMoney;
    payments?: { captures?: PayPalCapture[] };
  }>;
};

type CachedToken = { value: string; expiresAt: number };
const globalForPayPal = globalThis as typeof globalThis & {
  __leadflowPayPalToken?: CachedToken;
};

export function paypalMode(): PayPalMode {
  return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
}

export function paypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_ENABLED === "true" &&
      process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET,
  );
}

export function paypalPublicClientId(): string | null {
  if (!paypalConfigured()) return null;
  return process.env.PAYPAL_CLIENT_ID || null;
}

function paypalApiBase(): string {
  return paypalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function credentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!paypalConfigured() || !clientId || !secret) {
    throw new Error("PayPal is not configured");
  }
  return { clientId, secret };
}

async function accessToken(): Promise<string> {
  const cached = globalForPayPal.__leadflowPayPalToken;
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.value;

  const { clientId, secret } = credentials();
  const authorization = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("PayPal token request failed", res.status, detail.slice(0, 500));
    throw new Error("PayPal authentication failed");
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("PayPal returned no access token");

  globalForPayPal.__leadflowPayPalToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max((data.expires_in ?? 300) - 60, 30) * 1000,
  };
  return data.access_token;
}

async function paypalRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${paypalApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("PayPal API request failed", path, res.status, detail.slice(0, 1000));
    throw new Error("PayPal could not complete the request");
  }
  return (await res.json()) as T;
}

export async function createPayPalOrder(opts: {
  invoiceId: number;
  invoiceNumber: string;
  amount: string;
  description: string;
  brandName: string;
}): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `leadflow-invoice-${opts.invoiceId}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `invoice-${opts.invoiceId}`,
          custom_id: `leadflow-invoice-${opts.invoiceId}`,
          description: `${opts.description} (${opts.invoiceNumber})`.slice(0, 127),
          amount: { currency_code: "USD", value: opts.amount },
        },
      ],
      payment_source: undefined,
      application_context: {
        brand_name: opts.brandName.slice(0, 127),
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    { method: "POST", body: "{}" },
  );
}

export async function verifyPayPalWebhook(
  headers: Headers,
  event: unknown,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !paypalConfigured()) return false;

  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  const transmissionSig = headers.get("paypal-transmission-sig");
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const result = await paypalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    },
  );
  return result.verification_status === "SUCCESS";
}

export function captureFromOrder(order: PayPalOrder): PayPalCapture | null {
  return order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? [])[0] ?? null;
}

export function paymentSourceFromOrder(order: PayPalOrder): "card" | "paypal" {
  return order.payment_source && "card" in order.payment_source ? "card" : "paypal";
}

export function invoiceIdFromCustomId(customId: string | undefined): number | null {
  const match = /^leadflow-invoice-(\d+)$/.exec(customId ?? "");
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function ensurePayPalColumns(): Promise<void> {
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_order_id varchar(40)`);
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_capture_id varchar(40)`);
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_status varchar(30)`);
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_payment_source varchar(30)`);
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_payer_email varchar(190)`);
  await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_fee_amount numeric(12,2)`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS invoices_paypal_order_unique ON invoices(paypal_order_id) WHERE paypal_order_id IS NOT NULL`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS invoices_paypal_capture_unique ON invoices(paypal_capture_id) WHERE paypal_capture_id IS NOT NULL`);
}
