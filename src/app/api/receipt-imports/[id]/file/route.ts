import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { receiptImports } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

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
  if (!user || !can(user.role, "job_financials")) {
    return new Response("Not authorized", { status: 403 });
  }

  const { id: rawId } = await params;
  const receiptImportId = Number(rawId);
  if (!Number.isInteger(receiptImportId) || receiptImportId <= 0) {
    return new Response("Receipt not found", { status: 404 });
  }

  const [receipt] = await db
    .select({
      fileData: receiptImports.fileData,
      fileName: receiptImports.fileName,
      mimeType: receiptImports.mimeType,
    })
    .from(receiptImports)
    .where(
      and(
        eq(receiptImports.id, receiptImportId),
        eq(receiptImports.orgId, user.orgId),
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
