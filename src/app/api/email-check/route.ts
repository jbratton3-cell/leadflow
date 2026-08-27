import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Diagnostic endpoint: verifies the email configuration the RUNNING deployment
// actually sees, and performs a live test send. Key-protected; not linked anywhere.
const DIAG_KEY = "jmb-diag-4821";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== DIAG_KEY) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const user = process.env.GMAIL_USER ?? null;
  const pass = process.env.GMAIL_APP_PASS ?? null;

  const info: Record<string, unknown> = {
    deployment: {
      env: process.env.VERCEL_ENV ?? "unknown",
      commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || "unknown",
      url: process.env.VERCEL_URL ?? "unknown",
      builtAt: new Date().toISOString(),
    },
    config: {
      gmailUser: user,
      appPassLength: pass ? pass.length : 0,
      appPassShape: pass ? `${pass.slice(0, 2)}...${pass.slice(-2)}` : null,
      orgName: process.env.CRM_ORGANIZATION_NAME ?? null,
      adminEmail: process.env.CRM_ADMIN_EMAIL ?? null,
      appUrl: process.env.APP_URL ?? null,
    },
  };

  if (!user || !pass) {
    return NextResponse.json({ ...info, verdict: "MISSING ENV VARS — the deployment cannot see the Gmail settings" });
  }

  // Live test send
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"LeadFlow Diagnostic" <${user}>`,
      to: process.env.CRM_ADMIN_EMAIL || user,
      subject: "LeadFlow email diagnostic — success",
      text: "If you received this, email sending works from the live deployment.",
    });
    return NextResponse.json({ ...info, verdict: "SEND SUCCEEDED — email is working from this deployment" });
  } catch (err) {
    return NextResponse.json({
      ...info,
      verdict: "SEND FAILED — credentials visible to the app but rejected",
      sendError: String(err),
    });
  }
}
