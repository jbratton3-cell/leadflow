import "server-only";

import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Invoice, Lead } from "@/db/schema";
import { money, personName } from "@/lib/constants";

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.42, 0.47, 0.55);
const ACCENT = rgb(0.96, 0.42, 0.06);
const LINE = rgb(0.89, 0.91, 0.94);
const GREEN = rgb(0.02, 0.55, 0.32);

function dateLabel(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function kindLabel(kind: string): string {
  if (kind === "deposit") return "50% Deposit";
  if (kind === "final") return "Final Payment";
  return "Payment";
}

export async function buildPaymentReceiptPdf(opts: {
  invoice: Invoice;
  lead: Lead | null;
  orgName: string;
}): Promise<Uint8Array> {
  const { invoice, lead, orgName } = opts;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page: PDFPage = pdf.addPage([612, 792]);
  const W = 612;
  const M = 52;

  const text = (
    value: string,
    x: number,
    y: number,
    size = 10,
    face: PDFFont = font,
    color = INK,
  ) => page.drawText(value, { x, y, size, font: face, color });

  let logoOk = false;
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "buildpros-logo.png"));
    const logo = await pdf.embedPng(logoBytes);
    const logoH = 42;
    const logoW = logo.width * (logoH / logo.height);
    page.drawImage(logo, { x: M, y: 700, width: logoW, height: logoH });
    logoOk = true;
  } catch {
    // Use the text fallback below when the logo is unavailable.
  }

  if (!logoOk) {
    page.drawRectangle({ x: M, y: 700, width: 36, height: 36, color: ACCENT });
    text(orgName.slice(0, 1).toUpperCase(), M + 10, 710, 20, bold, rgb(1, 1, 1));
    text(orgName, M + 48, 716, 16, bold);
  }

  text("PAYMENT RECEIPT", M, 650, 24, bold);
  text(invoice.number, W - M - 100, 664, 12, bold);
  text("PAID", W - M - 100, 646, 10, bold, GREEN);
  page.drawLine({ start: { x: M, y: 632 }, end: { x: W - M, y: 632 }, thickness: 1, color: LINE });

  const customerName = lead
    ? personName(lead.firstName, lead.lastName, "Customer")
    : "Customer";
  text("Received from", M, 600, 10, font, MUTED);
  text(customerName, M, 578, 16, bold);
  if (lead?.address) {
    text(
      `${lead.address}${lead.city ? `, ${lead.city}` : ""}${lead.state ? `, ${lead.state}` : ""}`,
      M,
      558,
      10,
      font,
      MUTED,
    );
  }
  if (lead?.email) text(lead.email, M, 542, 10, font, MUTED);

  page.drawRectangle({ x: M, y: 418, width: W - M * 2, height: 92, color: rgb(0.97, 0.98, 0.99) });
  text("Amount received", M + 18, 480, 10, font, MUTED);
  text(money(invoice.amount), M + 18, 444, 30, bold, GREEN);
  text(`Project total: ${money(invoice.contractTotal)}`, W - M - 168, 464, 10, font, MUTED);

  const rows: [string, string][] = [
    ["Receipt number", invoice.number],
    ["Payment type", kindLabel(invoice.kind)],
    ["Payment date", dateLabel(invoice.paidAt)],
    ["Payment method", invoice.paymentMethod ? invoice.paymentMethod.toUpperCase() : "Other"],
  ];
  let y = 374;
  for (const [label, value] of rows) {
    page.drawLine({ start: { x: M, y: y - 10 }, end: { x: W - M, y: y - 10 }, thickness: 0.7, color: LINE });
    text(label, M, y, 10, font, MUTED);
    text(value, W - M - Math.min(190, bold.widthOfTextAtSize(value, 10)), y, 10, bold);
    y -= 42;
  }

  page.drawLine({ start: { x: M, y: 174 }, end: { x: W - M, y: 174 }, thickness: 1, color: LINE });
  text("Thank you for your business.", M, 142, 12, bold);
  text(`This receipt was issued by ${orgName}.`, M, 122, 10, font, MUTED);
  text("Please keep this receipt for your records.", M, 104, 10, font, MUTED);

  return pdf.save();
}