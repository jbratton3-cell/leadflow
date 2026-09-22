"use server";

import { db } from "@/db";
import { demoRequests } from "@/db/schema";
import { sendEmail } from "@/lib/notify";

function str(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Public contact-form leads go through the LeadFlow contact alias, which
// forwards to the business inbox.
function leadAlertInbox(): string {
  return "contact@leadflowcrm.info";
}

function looksLikeSpam(fields: {
  name: string;
  email: string;
  company: string;
  message: string;
}): boolean {
  const emailDomain = fields.email.split("@").at(-1)?.toLowerCase() ?? "";
  if (emailDomain === "search-leadflowcrm.info") return true;

  const text = [fields.name, fields.email, fields.company, fields.message]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");

  const knownSpamPhrases = [
    "search index",
    "targeted instagram followers",
    "scale your instagram",
    "grow your instagram",
    "our videos can generate",
    "video to advertise your business",
    "seo services",
    "seo package",
    "rank your website",
    "rank on google",
    "first page of google",
    "guest post",
    "backlink",
    "domain authority",
    "website traffic",
    "find out more information here",
    "if you are not interested",
    "unsubscribe:",
  ];
  if (knownSpamPhrases.some((phrase) => text.includes(phrase))) return true;

  const hasExternalLink =
    /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|co|site|pro|biz)\b/i.test(
      fields.message
    );
  const soundsLikeSalesPitch =
    /\b(?:we (?:help|offer|provide|specialize)|our (?:services?|videos?|team)|i can (?:show|send)|register .+ today|submit .+ today|list .+ today)\b/i.test(
      text
    );

  return hasExternalLink && soundsLikeSalesPitch;
}

function demoRequestEmailHtml(opts: {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  trade: string | null;
  message: string | null;
}): string {
  const rows: [string, string][] = [
    ["Name", opts.name],
    ["Email", opts.email],
  ];
  if (opts.company) rows.push(["Company", opts.company]);
  if (opts.phone) rows.push(["Phone", opts.phone]);
  if (opts.trade) rows.push(["Trade", opts.trade]);
  if (opts.message) rows.push(["Message", opts.message]);

  const body = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td>
          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${esc(value)}</td>
        </tr>`
    )
    .join("");

  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:20px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#f97316;padding:14px 20px">
        <div style="color:#ffffff;font-size:16px;font-weight:700">New LeadFlow lead</div>
        <div style="color:#ffedd5;font-size:12px">Submitted from the public contact form</div>
      </div>
      <table style="padding:16px 20px;border-collapse:collapse">${body}</table>
      <div style="padding:0 20px 18px;font-size:12px;color:#64748b">
        Replying to this email goes straight to ${esc(opts.email)}.
      </div>
    </div>
  </div>`;
}

// Public action — anyone can submit a pricing/demo request from the marketing site.
export async function submitDemoRequest(
  _prev: { success?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const company = str(formData.get("company"));
  const phone = str(formData.get("phone"));
  const trade = str(formData.get("trade"));
  const message = str(formData.get("message"));
  const website = str(formData.get("website"));
  const faxNumber = str(formData.get("faxNumber"));
  const formStartedAt = Number(str(formData.get("formStartedAt")));
  const formAgeMs = Date.now() - formStartedAt;

  // Quietly accept bot submissions so they cannot learn which trap caught them.
  if (
    website ||
    faxNumber ||
    !Number.isFinite(formStartedAt) ||
    formAgeMs < 2_500 ||
    formAgeMs > 24 * 60 * 60 * 1_000
  ) {
    return { success: true };
  }

  if (!name || !email) {
    return { error: "Please provide your name and email." };
  }
  // Basic email sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (looksLikeSpam({ name, email, company, message })) {
    return { success: true };
  }

  await db.insert(demoRequests).values({
    name,
    email,
    company: company || null,
    phone: phone || null,
    trade: trade || null,
    message: message || null,
  });

  // Alert the owner so a lead never sits unread in the table.
  const sent = await sendEmail({
    to: leadAlertInbox(),
    subject: `New lead: ${name}${trade ? ` (${trade})` : ""}`,
    fromName: "LeadFlow CRM",
    replyTo: email,
    html: demoRequestEmailHtml({
      name,
      email,
      company: company || null,
      phone: phone || null,
      trade: trade || null,
      message: message || null,
    }),
  });
  if (!sent) console.error("Demo request email failed for", email);

  return { success: true };
}
