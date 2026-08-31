import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/notify";

// Public endpoint for the JMB Business Solutions website contact form
// (jmbcreative.org). Submissions are emailed to JMB via the LeadFlow email
// pipeline (Resend). CORS-open to the JMB domain only.
export const dynamic = "force-dynamic";

const ALLOWED_ORIGIN = "https://jmbcreative.org";
const ALLOWED_WWW = "https://www.jmbcreative.org";
const cors = (req: Request) => ({
  "Access-Control-Allow-Origin":
    req.headers.get("origin") === ALLOWED_WWW ? ALLOWED_WWW : ALLOWED_ORIGIN,
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (origin && origin !== ALLOWED_ORIGIN && origin !== ALLOWED_WWW) {
    return NextResponse.json({ error: "not allowed" }, { status: 403, headers: cors(req) });
  }

  let name = "";
  let email = "";
  let phone = "";
  let service = "";
  let message = "";

  try {
    const body = await req.json();
    name = String(body.name ?? "").trim().slice(0, 120);
    email = String(body.email ?? "").trim().slice(0, 190);
    phone = String(body.phone ?? "").trim().slice(0, 40);
    service = String(body.service ?? "").trim().slice(0, 120);
    message = String(body.message ?? "").trim().slice(0, 4000);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: cors(req) });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400, headers: cors(req) });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400, headers: cors(req) });
  }

  const to = process.env.JMB_CONTACT_EMAIL || "leadflow76@gmail.com";

  const ok = await sendEmail({
    to,
    subject: `JMB website inquiry — ${service || "General"} — ${name}`,
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a">New inquiry from jmbcreative.org</h2>
        <table style="font-size:14px;color:#334155">
          <tr><td style="padding:4px 12px 4px 0;font-weight:600">Name:</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:600">Email:</td><td>${escapeHtml(email)}</td></tr>
          ${phone ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Phone:</td><td>${escapeHtml(phone)}</td></tr>` : ""}
          ${service ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600">Service:</td><td>${escapeHtml(service)}</td></tr>` : ""}
        </table>
        <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:10px;color:#334155;white-space:pre-wrap">${escapeHtml(message)}</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Reply directly to this customer at ${escapeHtml(email)}.</p>
      </div>`,
  });

  if (!ok) {
    return NextResponse.json({ error: "send_failed" }, { status: 500, headers: cors(req) });
  }
  return NextResponse.json({ ok: true }, { headers: cors(req) });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
