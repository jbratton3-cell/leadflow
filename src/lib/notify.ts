import "server-only";

// Best-effort email + SMS delivery for invitations.
// Both are optional: if the relevant env vars aren't set, we return false and
// the caller falls back to showing a copyable invite link in the UI.

export function getBaseUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

// Send an email via the Resend REST API (no SDK dependency).
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = process.env.RESEND_FROM ?? "LeadFlow <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Send an SMS via the Twilio REST API (no SDK dependency).
export async function sendSms(opts: { to: string; body: string }): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return false;
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: opts.to, From: from, Body: opts.body }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function estimateEmailHtml(opts: {
  customerName: string;
  companyName: string;
  number: string;
  total: string;
  link: string;
}): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <div style="width:40px;height:40px;border-radius:10px;background:#f97316;color:#fff;
        display:grid;place-items:center;font-weight:700;font-size:20px">H</div>
      <strong style="font-size:18px;color:#0f172a">${opts.companyName}</strong>
    </div>
    <h2 style="color:#0f172a;font-size:20px">Your estimate is ready</h2>
    <p style="color:#334155;line-height:1.5">
      Hi ${opts.customerName}, thank you for the opportunity to earn your business.
      Your estimate <strong>${opts.number}</strong> is ready to review.
    </p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:12px">
      <div style="color:#64748b;font-size:13px">Estimate total</div>
      <div style="color:#0f172a;font-size:28px;font-weight:700">${opts.total}</div>
    </div>
    <a href="${opts.link}" style="display:inline-block;margin:8px 0;padding:12px 20px;
      background:#f97316;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">
      View &amp; Respond to Estimate
    </a>
    <p style="color:#94a3b8;font-size:13px">
      Or paste this link into your browser:<br>
      <span style="color:#475569">${opts.link}</span>
    </p>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px">
      You can accept or decline this estimate online using the button above.
    </p>
  </div>`;
}

export function inviteEmailHtml(name: string, link: string): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <div style="width:40px;height:40px;border-radius:10px;background:#f97316;color:#fff;
        display:grid;place-items:center;font-weight:700;font-size:20px">H</div>
      <strong style="font-size:18px;color:#0f172a">LeadFlow</strong>
    </div>
    <h2 style="color:#0f172a;font-size:20px">You've been invited</h2>
    <p style="color:#334155;line-height:1.5">
      Hi ${name}, you've been invited to join your team's LeadFlow account.
      Click below to set your password and get started.
    </p>
    <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 20px;
      background:#f97316;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">
      Accept Invitation
    </a>
    <p style="color:#94a3b8;font-size:13px">
      Or paste this link into your browser:<br>
      <span style="color:#475569">${link}</span>
    </p>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px">
      This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.
    </p>
  </div>`;
}
