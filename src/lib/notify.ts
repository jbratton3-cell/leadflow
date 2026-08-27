import "server-only";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

let logoCache: Buffer | null = null;
function buildprosLogo(): Buffer | null {
  try {
    logoCache ??= fs.readFileSync(
      path.join(process.cwd(), "public", "buildpros-logo.png")
    );
    return logoCache;
  } catch {
    return null;
  }
}
import { APP_NAME } from "@/lib/constants";

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
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASS);
}

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

// Send an email via Gmail SMTP using Nodemailer.
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string; cid?: string }[];
}): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;
  if (!user || !pass) return false;

  const fromName = process.env.CRM_ORGANIZATION_NAME || "LeadFlow";

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const attachments = (opts.attachments ?? []).map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      cid: a.cid,
    }));
    if (opts.html.includes("cid:buildpros-logo")) {
      const logo = buildprosLogo();
      if (logo) {
        attachments.push({
          filename: "buildpros-logo.png",
          content: logo,
          contentType: "image/png",
          cid: "buildpros-logo",
        });
      }
    }
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments,
    });
    return true;
  } catch (err) {
    console.error("Gmail send error:", err);
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
    <div style="margin-bottom:20px">
      <img src="cid:buildpros-logo" alt="${opts.companyName}" width="219" height="30"
        style="display:block;height:30px;width:auto" />
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
        display:grid;place-items:center;font-weight:700;font-size:20px">${APP_NAME.slice(0, 1)}</div>
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

export function invoiceEmailHtml(opts: {
  customerName: string;
  companyName: string;
  number: string;
  amountLabel: string;
  amount: string;
  total: string;
  link: string;
  kind?: string;
}): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <div style="margin-bottom:20px">
      <img src="cid:buildpros-logo" alt="${opts.companyName}" width="219" height="30"
        style="display:block;height:30px;width:auto" />
    </div>
    <h2 style="color:#0f172a;font-size:20px">Your invoice is ready</h2>
    <p style="color:#334155;line-height:1.5">
      Hi ${opts.customerName}, thank you for your business.
      Invoice <strong>${opts.number}</strong> for your <strong>${opts.amountLabel}</strong> is ready.
    </p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:12px">
      <div style="color:#64748b;font-size:13px">Amount due</div>
      <div style="color:#0f172a;font-size:28px;font-weight:700">${opts.amount}</div>
      <div style="color:#64748b;font-size:13px;margin-top:4px">Project total: ${opts.total}</div>
    </div>
    <a href="${opts.link}" style="display:inline-block;margin:8px 0;padding:12px 20px;
      background:#f97316;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">
      View &amp; Pay Invoice
    </a>
    ${opts.kind === "final"
      ? `<p style="color:#334155;font-size:14px;line-height:1.5">
      On the invoice page you can pay this amount directly or choose to finance it.
    </p>`
      : `<p style="color:#334155;font-size:14px;line-height:1.5">
      This down payment is due upon receipt — our office will reach out to arrange payment.
    </p>`}
    <p style="color:#94a3b8;font-size:13px">
      Or paste this link into your browser:<br>
      <span style="color:#475569">${opts.link}</span>
    </p>
  </div>`;
}

export function financingRequestedEmailHtml(opts: {
  customerName: string;
  number: string;
  amount: string;
  kind: string;
}): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="color:#0f172a;font-size:20px">&#128176; Financing requested</h2>
    <p style="color:#334155;line-height:1.5">
      <strong>${opts.customerName}</strong> chose financing on invoice
      <strong>${opts.number}</strong> (${opts.kind}).
    </p>
    <div style="margin:16px 0;padding:16px;background:#fef3c7;border-radius:12px">
      <div style="color:#92400e;font-size:13px">Amount to finance</div>
      <div style="color:#78350f;font-size:28px;font-weight:700">${opts.amount}</div>
    </div>
    <p style="color:#334155;font-size:14px">
      No payment is expected for this invoice. Follow up with the customer to complete
      the financing application.
    </p>
  </div>`;
}

export function signedEstimateEmailHtml(opts: {
  customerName: string;
  companyName: string;
  number: string;
  link: string;
}): string {
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <div style="margin-bottom:20px">
      <img src="cid:buildpros-logo" alt="${opts.companyName}" width="219" height="30"
        style="display:block;height:30px;width:auto" />
    </div>
    <h2 style="color:#0f172a;font-size:20px">Your signed estimate is attached</h2>
    <p style="color:#334155;line-height:1.5">
      Hi ${opts.customerName}, thank you for your business! A copy of your accepted and
      signed estimate <strong>${opts.number}</strong> is attached as a PDF for your records.
    </p>
    <p style="color:#334155;font-size:14px">
      You can also view it online anytime:
    </p>
    <a href="${opts.link}" style="display:inline-block;margin:8px 0;padding:12px 20px;
      background:#f97316;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">
      View Estimate Online
    </a>
  </div>`;
}
