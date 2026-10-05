import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses, receiptImports } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SAFE_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function disposition(fileName: string): string {
  const asciiName = fileName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/[\\"\r\n]/g, "_");
  const encodedName = encodeURIComponent(fileName).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new Response("Not authenticated", { status: 401 });

  const { id: rawId } = await params;
  const expenseId = Number(rawId);
  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return new Response("Receipt not found", { status: 404 });
  }

  const [receipt] = await db
    .select({
      fileData: receiptImports.fileData,
      fileName: receiptImports.fileName,
      mimeType: receiptImports.mimeType,
    })
    .from(receiptImports)
    .innerJoin(expenses, eq(expenses.id, receiptImports.expenseId))
    .where(
      and(
        eq(receiptImports.expenseId, expenseId),
        eq(receiptImports.status, "imported"),
        eq(expenses.orgId, user.orgId),
      ),
    )
    .limit(1);

  if (!receipt) return new Response("Receipt not found", { status: 404 });

  const mimeType = SAFE_RECEIPT_TYPES.has(receipt.mimeType)
    ? receipt.mimeType
    : "application/octet-stream";
  const bytes = Uint8Array.from(receipt.fileData);

  return new Response(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": disposition(receipt.fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
