import "server-only";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Estimate, EstimateItem, Lead } from "@/db/schema";
import { money } from "@/lib/constants";

// Builds a clean, print-quality PDF of a (signed) estimate for emailing
// and downloading. Pure pdf-lib — no headless browser needed.

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.45, 0.5, 0.58);
const ACCENT = rgb(0.96, 0.42, 0.06);
const LINE = rgb(0.89, 0.91, 0.94);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = (text ?? "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildSignedEstimatePdf(opts: {
  est: Estimate;
  items: EstimateItem[];
  lead: Lead | null;
  orgName: string;
}): Promise<Uint8Array> {
  const { est, items, lead, orgName } = opts;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 612;
  const H = 792;
  const M = 50; // margin
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 10,
    f: PDFFont = font,
    color = INK
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  const ensureSpace = (needed: number) => {
    if (y - needed < 70) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };

  // Header — BuildPros logo, falling back to a letter square if unavailable
  let logoOk = false;
  const logoH = 44;
  try {
    const logoBytes = fs.readFileSync(
      path.join(process.cwd(), "public", "buildpros-logo.png")
    );
    const logo = await pdf.embedPng(logoBytes);
    const w = logo.width * (logoH / logo.height);
    page.drawImage(logo, { x: M, y: y - logoH + 8, width: w, height: logoH });
    logoOk = true;
  } catch {
    // fall through to text header
  }
  if (logoOk) {
    text("Estimate", M, y - logoH - 6, 10, font, MUTED);
  } else {
    page.drawRectangle({ x: M, y: y - 34, width: 34, height: 34, color: ACCENT });
    text(orgName.slice(0, 1), M + 9, y - 25, 20, bold, rgb(1, 1, 1));
    text(orgName, M + 44, y - 12, 16, bold);
    text("Estimate", M + 44, y - 26, 10, font, MUTED);
  }
  text(est.number, W - M - 90, y - 12, 12, bold);
  if (est.status === "accepted") {
    text("ACCEPTED", W - M - 90, y - 26, 9, bold, rgb(0.02, 0.6, 0.35));
  }
  y -= logoOk ? 84 : 56;

  // Bill-to block
  if (lead) {
    const name = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Customer";
    text("Billed to:", M, y, 9, bold, MUTED);
    text(name, M, y - 13, 11, bold);
    let by = y - 26;
    const addr = [
      lead.address,
      [lead.city, lead.state, lead.zip].filter(Boolean).join(" "),
      lead.email,
      lead.phone,
    ].filter(Boolean) as string[];
    for (const a of addr) {
      text(a, M, by, 9, font, MUTED);
      by -= 12;
    }
    y = Math.min(by, y - 60);
  } else {
    y -= 30;
  }

  // Items table header
  ensureSpace(120);
  y -= 10;
  page.drawRectangle({ x: M, y: y - 16, width: W - 2 * M, height: 18, color: rgb(0.97, 0.98, 0.99) });
  text("Description", M + 6, y - 11, 9, bold, MUTED);
  text("Qty", W - M - 190, y - 11, 9, bold, MUTED);
  text("Unit", W - M - 130, y - 11, 9, bold, MUTED);
  text("Amount", W - M - 80, y - 11, 9, bold, MUTED);
  y -= 24;

  for (const it of items) {
    const descLines = wrap(it.description, font, 10, W - M * 2 - 210);
    const rowH = Math.max(descLines.length * 12 + 6, 18);
    ensureSpace(rowH + 10);
    descLines.forEach((ln, i) => text(ln, M + 6, y - i * 12, 10));
    text(String(Number(it.quantity)), W - M - 190, y, 10);
    text(money(it.unitPrice), W - M - 130, y, 10);
    text(money(it.amount), W - M - 80, y, 10, bold);
    y -= rowH;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.5, color: LINE });
  }

  // Totals
  ensureSpace(110);
  y -= 12;
  const totalRow = (label: string, value: string, isBig = false) => {
    text(label, W - M - 240, y, isBig ? 11 : 10, isBig ? bold : font, MUTED);
    text(value, W - M - 80, y, isBig ? 13 : 10, bold, isBig ? INK : MUTED);
    y -= isBig ? 20 : 15;
  };
  totalRow("Subtotal", money(est.subtotal));
  if (Number(est.discount) > 0) totalRow("Discount", `- ${money(est.discount)}`);
  totalRow(`Tax (${Number(est.taxRate)}%)`, money(est.taxAmount));
  page.drawLine({ start: { x: W - M - 250, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 1, color: INK });
  totalRow("Total", money(est.total), true);

  // Terms / notes
  const blocks: [string, string][] = [];
  if (est.terms) blocks.push(["Terms & Conditions", est.terms]);
  if (est.notes) blocks.push(["Notes", est.notes]);
  for (const [title, body] of blocks) {
    ensureSpace(60);
    y -= 10;
    text(title, M, y, 9, bold, MUTED);
    y -= 13;
    for (const ln of wrap(body, font, 9, W - 2 * M)) {
      ensureSpace(16);
      text(ln, M, y, 9, font, MUTED);
      y -= 12;
    }
  }

  // Signature block
  if (est.signatureData) {
    ensureSpace(140);
    y -= 28;
    try {
      const png = await pdf.embedPng(est.signatureData);
      const dims = png.scale(0.55);
      page.drawRectangle({
        x: M,
        y: y - dims.height - 10,
        width: 220,
        height: dims.height + 12,
        borderColor: LINE,
        borderWidth: 1,
      });
      page.drawImage(png, { x: M + 8, y: y - dims.height - 2, width: dims.width, height: dims.height });
    } catch {
      // ignore bad signature image
    }
    const signedLine = [
      "Signed" + (est.signatureName ? ` by ${est.signatureName}` : ""),
      est.signatureAt ? new Date(est.signatureAt).toLocaleString("en-US") : "",
    ]
      .filter(Boolean)
      .join(" — ");
    text(signedLine, M, y - 90, 9, font, MUTED);
    y -= 110;
  }

  // Footer
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Powered by LeadFlow — page ${i + 1} of ${pages.length}`, {
      x: W / 2 - 80,
      y: 30,
      size: 8,
      font,
      color: MUTED,
    });
  });

  return pdf.save();
}
