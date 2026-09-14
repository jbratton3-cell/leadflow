"use server";

import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { hcpPayments, migrationRecords } from "@/db/schema";
import { requireAccess } from "@/lib/auth";

type CsvRow = Record<string, string>;
type Severity = "warning" | "error";

export type HcpPaymentIssue = {
  severity: Severity;
  message: string;
};

export type HcpPaymentPreview = {
  rows: number;
  duplicateRows: number;
  alreadyImported: number;
  newPayments: number;
  matchedCustomers: number;
  matchedJobs: number;
  matchedInvoices: number;
  unmatchedCustomers: number;
  unmatchedJobs: number;
  unmatchedInvoices: number;
  totalAmount: string;
  issues: HcpPaymentIssue[];
};

export type HcpPaymentImportResult = {
  imported: number;
  duplicateRows: number;
  alreadyImported: number;
  totalAmount: string;
  issues: HcpPaymentIssue[];
};

const SOURCE_SYSTEM = "housecall_pro";
const clean = (value: unknown) => String(value ?? "").trim();

function normalize(value: unknown): string {
  return clean(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseMoney(value: unknown): string {
  const text = clean(value).replace(/[$,\s]/g, "");
  const number = Number(text || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function isValidMoney(value: unknown): boolean {
  const text = clean(value).replace(/[$,\s]/g, "");
  return Boolean(text) && Number.isFinite(Number(text));
}

function parseDate(value: unknown): Date | null {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanJobNumber(value: unknown): string {
  let text = clean(value);
  if (text.startsWith('="') && text.endsWith('"')) text = text.slice(2, -1);
  return text.replace(/^"|"$/g, "");
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\r") {
      continue;
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((candidate) =>
    candidate.some((cell) => cell.trim() !== ""),
  );
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim(),
  );
  return nonEmptyRows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? "").trim()])),
  );
}

async function readPayments(formData: FormData): Promise<CsvRow[]> {
  const value = formData.get("payments");
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("Upload the payments export before continuing.");
  }
  const rows = parseCsv(Buffer.from(await value.arrayBuffer()).toString("utf8"));
  if (!rows.length) throw new Error("The payments export has no readable data rows.");
  return rows;
}

function requiredHeaders(rows: CsvRow[]): string[] {
  const required = [
    "Job ID",
    "Payment Received Date",
    "Customer ID",
    "Customer Name",
    "Invoice Number",
    "Payment Amount",
  ];
  const actual = new Set(Object.keys(rows[0] ?? {}));
  return required.filter((header) => !actual.has(header));
}

function paymentSourceId(row: CsvRow): string {
  const fingerprint = [
    clean(row["Job ID"]),
    parseDate(row["Payment Received Date"])?.toISOString() ?? clean(row["Payment Received Date"]),
    clean(row["Customer ID"]),
    cleanJobNumber(row["Invoice Number"]),
    parseMoney(row["Payment Amount"]),
    parseMoney(row["Tax Amount"]),
    parseMoney(row["Tip Amount"]),
    parseMoney(row["Fee Amount"]),
    normalize(row["Payment Type"]),
    normalize(row["Fee Type"]),
  ].join("|");
  return createHash("sha256").update(fingerprint).digest("hex");
}

function storedPaymentSourceId(payment: {
  receivedAt: Date | null;
  amount: string;
  taxAmount: string;
  tipAmount: string;
  feeAmount: string;
  paymentType: string | null;
  feeType: string | null;
  customerExternalId: string | null;
  jobReference: string | null;
}): string {
  return createHash("sha256")
    .update(
      [
        "",
        payment.receivedAt?.toISOString() ?? "",
        payment.customerExternalId ?? "",
        payment.jobReference ?? "",
        payment.amount,
        payment.taxAmount,
        payment.tipAmount,
        payment.feeAmount,
        normalize(payment.paymentType),
        normalize(payment.feeType),
      ].join("|"),
    )
    .digest("hex");
}

type ExistingData = {
  paymentIds: Set<string>;
  migrationIds: Set<string>;
  customerIds: Map<string, number>;
  jobIds: Map<string, number>;
  invoiceIds: Map<string, number>;
};

async function loadExistingData(orgId: number): Promise<ExistingData> {
  const [payments, records] = await Promise.all([
    db
      .select({
        receivedAt: hcpPayments.receivedAt,
        amount: hcpPayments.amount,
        taxAmount: hcpPayments.taxAmount,
        tipAmount: hcpPayments.tipAmount,
        feeAmount: hcpPayments.feeAmount,
        paymentType: hcpPayments.paymentType,
        feeType: hcpPayments.feeType,
        customerExternalId: hcpPayments.customerExternalId,
        jobReference: hcpPayments.jobReference,
      })
      .from(hcpPayments)
      .where(eq(hcpPayments.orgId, orgId)),
    db
      .select({
        entityType: migrationRecords.entityType,
        sourceId: migrationRecords.sourceId,
        targetId: migrationRecords.targetId,
      })
      .from(migrationRecords)
      .where(
        and(
          eq(migrationRecords.orgId, orgId),
          eq(migrationRecords.sourceSystem, SOURCE_SYSTEM),
        ),
      ),
  ]);

  const paymentIds = new Set(payments.map(storedPaymentSourceId));
  const migrationIds = new Set(
    records
      .filter((record) => record.entityType === "payment")
      .map((record) => record.sourceId),
  );
  const customerIds = new Map(
    records
      .filter((record) => record.entityType === "customer")
      .map((record) => [record.sourceId, record.targetId]),
  );
  const jobIds = new Map(
    records
      .filter((record) => record.entityType === "job")
      .map((record) => [cleanJobNumber(record.sourceId), record.targetId]),
  );
  const invoiceIds = new Map(
    records
      .filter((record) => record.entityType === "invoice")
      .map((record) => [cleanJobNumber(record.sourceId), record.targetId]),
  );

  return { paymentIds, migrationIds, customerIds, jobIds, invoiceIds };
}

function analyzeRows(rows: CsvRow[], existing: ExistingData) {
  const seen = new Set<string>();
  const uniqueRows: { row: CsvRow; sourceId: string }[] = [];
  const issues: HcpPaymentIssue[] = [];
  let duplicateRows = 0;
  let alreadyImported = 0;
  let matchedCustomers = 0;
  let matchedJobs = 0;
  let matchedInvoices = 0;
  let invalidRows = 0;
  let validRows = 0;
  let totalAmount = 0;

  for (const row of rows) {
    const sourceId = paymentSourceId(row);
    if (seen.has(sourceId)) {
      duplicateRows++;
      continue;
    }
    seen.add(sourceId);

    const receivedAt = parseDate(row["Payment Received Date"]);
    if (!receivedAt || !isValidMoney(row["Payment Amount"])) {
      invalidRows++;
      continue;
    }
    validRows++;

    const customerId = clean(row["Customer ID"]);
    const jobReference = cleanJobNumber(row["Invoice Number"]);
    const isAlreadyImported =
      existing.migrationIds.has(sourceId) ||
      existing.paymentIds.has(
        storedPaymentSourceId({
          receivedAt,
          amount: parseMoney(row["Payment Amount"]),
          taxAmount: parseMoney(row["Tax Amount"]),
          tipAmount: parseMoney(row["Tip Amount"]),
          feeAmount: parseMoney(row["Fee Amount"]),
          paymentType: clean(row["Payment Type"]) || null,
          feeType: clean(row["Fee Type"]) || null,
          customerExternalId: customerId || null,
          jobReference: jobReference || null,
        }),
      );

    if (isAlreadyImported) alreadyImported++;
    else uniqueRows.push({ row, sourceId });
    if (existing.customerIds.has(customerId)) matchedCustomers++;
    if (existing.jobIds.has(jobReference)) matchedJobs++;
    if (existing.invoiceIds.has(jobReference)) matchedInvoices++;
    totalAmount += Number(parseMoney(row["Payment Amount"]));
  }

  if (invalidRows) {
    issues.push({
      severity: "error",
      message: `${invalidRows} row(s) have an invalid payment date or amount and must be corrected before import.`,
    });
  }
  if (duplicateRows) {
    issues.push({
      severity: "warning",
      message: `${duplicateRows} duplicate row(s) appear inside this export and will be skipped.`,
    });
  }
  if (alreadyImported) {
    issues.push({
      severity: "warning",
      message: `${alreadyImported} payment(s) already exist in LeadFlow and will be skipped.`,
    });
  }

  const unmatchedCustomers = validRows - matchedCustomers;
  const unmatchedJobs = validRows - matchedJobs;
  const unmatchedInvoices = validRows - matchedInvoices;
  if (unmatchedCustomers) {
    issues.push({
      severity: "warning",
      message: `${unmatchedCustomers} payment(s) do not match an imported HCP customer and will be preserved without a lead link.`,
    });
  }
  if (unmatchedJobs) {
    issues.push({
      severity: "warning",
      message: `${unmatchedJobs} payment(s) do not match an imported HCP job and will be preserved without a job link.`,
    });
  }
  if (unmatchedInvoices) {
    issues.push({
      severity: "warning",
      message: `${unmatchedInvoices} payment(s) do not match an imported HCP invoice and will be preserved without an invoice link.`,
    });
  }

  return {
    uniqueRows,
    duplicateRows,
    alreadyImported,
    matchedCustomers,
    matchedJobs,
    matchedInvoices,
    unmatchedCustomers,
    unmatchedJobs,
    unmatchedInvoices,
    totalAmount: totalAmount.toFixed(2),
    issues,
  };
}

export async function previewHcpPayments(
  formData: FormData,
): Promise<HcpPaymentPreview | { error: string }> {
  const user = await requireAccess("import");
  try {
    const rows = await readPayments(formData);
    const missingHeaders = requiredHeaders(rows);
    if (missingHeaders.length) {
      return { error: `Payments export is missing required columns: ${missingHeaders.join(", ")}.` };
    }

    const existing = await loadExistingData(user.orgId);
    const analysis = analyzeRows(rows, existing);
    return {
      rows: rows.length,
      duplicateRows: analysis.duplicateRows,
      alreadyImported: analysis.alreadyImported,
      newPayments: analysis.uniqueRows.length,
      matchedCustomers: analysis.matchedCustomers,
      matchedJobs: analysis.matchedJobs,
      matchedInvoices: analysis.matchedInvoices,
      unmatchedCustomers: analysis.unmatchedCustomers,
      unmatchedJobs: analysis.unmatchedJobs,
      unmatchedInvoices: analysis.unmatchedInvoices,
      totalAmount: analysis.totalAmount,
      issues: analysis.issues,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to read the HCP payments export.",
    };
  }
}

export async function commitHcpPayments(
  formData: FormData,
): Promise<HcpPaymentImportResult | { error: string }> {
  const user = await requireAccess("import");
  try {
    const rows = await readPayments(formData);
    const missingHeaders = requiredHeaders(rows);
    if (missingHeaders.length) {
      return { error: `Payments export is missing required columns: ${missingHeaders.join(", ")}.` };
    }
    const invalidRows = rows.filter(
      (row) => !parseDate(row["Payment Received Date"]) || !isValidMoney(row["Payment Amount"]),
    ).length;
    if (invalidRows) {
      return {
        error: `${invalidRows} row(s) have an invalid payment date or amount and must be corrected before import.`,
      };
    }

    const result = {
      imported: 0,
      duplicateRows: 0,
      alreadyImported: 0,
      totalAmount: "0.00",
      issues: [] as HcpPaymentIssue[],
    };

    await db.transaction(async (tx) => {
      const [existingPayments, existingRecords] = await Promise.all([
        tx
          .select({
            receivedAt: hcpPayments.receivedAt,
            amount: hcpPayments.amount,
            taxAmount: hcpPayments.taxAmount,
            tipAmount: hcpPayments.tipAmount,
            feeAmount: hcpPayments.feeAmount,
            paymentType: hcpPayments.paymentType,
            feeType: hcpPayments.feeType,
            customerExternalId: hcpPayments.customerExternalId,
            jobReference: hcpPayments.jobReference,
          })
          .from(hcpPayments)
          .where(eq(hcpPayments.orgId, user.orgId)),
        tx
          .select({
            entityType: migrationRecords.entityType,
            sourceId: migrationRecords.sourceId,
            targetId: migrationRecords.targetId,
          })
          .from(migrationRecords)
          .where(
            and(
              eq(migrationRecords.orgId, user.orgId),
              eq(migrationRecords.sourceSystem, SOURCE_SYSTEM),
            ),
          ),
      ]);
      const existingPaymentIds = new Set(existingPayments.map(storedPaymentSourceId));
      const existingMigrationIds = new Set(
        existingRecords
          .filter((record) => record.entityType === "payment")
          .map((record) => record.sourceId),
      );
      const customerIds = new Map(
        existingRecords
          .filter((record) => record.entityType === "customer")
          .map((record) => [record.sourceId, record.targetId]),
      );
      const jobIds = new Map(
        existingRecords
          .filter((record) => record.entityType === "job")
          .map((record) => [cleanJobNumber(record.sourceId), record.targetId]),
      );
      const invoiceIds = new Map(
        existingRecords
          .filter((record) => record.entityType === "invoice")
          .map((record) => [cleanJobNumber(record.sourceId), record.targetId]),
      );
      const seen = new Set<string>();
      let totalAmount = 0;

      for (const row of rows) {
        const sourceId = paymentSourceId(row);
        if (seen.has(sourceId)) {
          result.duplicateRows++;
          continue;
        }
        seen.add(sourceId);

        const receivedAt = parseDate(row["Payment Received Date"]);
        if (!receivedAt || !isValidMoney(row["Payment Amount"])) continue;

        const customerExternalId = clean(row["Customer ID"]);
        const jobReference = cleanJobNumber(row["Invoice Number"]);
        const amount = parseMoney(row["Payment Amount"]);
        const taxAmount = parseMoney(row["Tax Amount"]);
        const tipAmount = parseMoney(row["Tip Amount"]);
        const feeAmount = parseMoney(row["Fee Amount"]);
        const paymentType = clean(row["Payment Type"]) || null;
        const feeType = clean(row["Fee Type"]) || null;
        const storedIdentity = storedPaymentSourceId({
          receivedAt,
          amount,
          taxAmount,
          tipAmount,
          feeAmount,
          paymentType,
          feeType,
          customerExternalId: customerExternalId || null,
          jobReference: jobReference || null,
        });
        if (existingMigrationIds.has(sourceId) || existingPaymentIds.has(storedIdentity)) {
          result.alreadyImported++;
          continue;
        }

        const [created] = await tx
          .insert(hcpPayments)
          .values({
            orgId: user.orgId,
            leadId: customerIds.get(customerExternalId) ?? null,
            jobId: jobIds.get(jobReference) ?? null,
            invoiceId: invoiceIds.get(jobReference) ?? null,
            receivedAt,
            amount,
            taxAmount,
            tipAmount,
            feeAmount,
            feeType,
            paymentType,
            customerName: clean(row["Customer Name"]) || null,
            customerExternalId: customerExternalId || null,
            jobReference: jobReference || null,
            notes: [
              `Imported from Housecall Pro payment transaction ${sourceId.slice(0, 12)}.`,
              clean(row["Job Description"]) ? clean(row["Job Description"]) : "",
              clean(row["Invoice Status"])
                ? `Original invoice status: ${clean(row["Invoice Status"])}.`
                : "",
            ]
              .filter(Boolean)
              .join(" "),
          })
          .returning({ id: hcpPayments.id });

        await tx.insert(migrationRecords).values({
          orgId: user.orgId,
          sourceSystem: SOURCE_SYSTEM,
          entityType: "payment",
          sourceId,
          targetTable: "hcp_payments",
          targetId: created.id,
          sourceHash: sourceId,
        });
        existingMigrationIds.add(sourceId);
        existingPaymentIds.add(storedIdentity);
        result.imported++;
        totalAmount += Number(amount);
      }

      result.totalAmount = totalAmount.toFixed(2);
      if (result.duplicateRows) {
        result.issues.push({
          severity: "warning",
          message: `${result.duplicateRows} duplicate row(s) inside the export were skipped.`,
        });
      }
      if (result.alreadyImported) {
        result.issues.push({
          severity: "warning",
          message: `${result.alreadyImported} payment(s) already in LeadFlow were skipped.`,
        });
      }
    });

    revalidatePath("/reports");
    revalidatePath("/production");
    revalidatePath("/invoices");
    revalidatePath("/import");
    return result;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to import the HCP payments.",
    };
  }
}