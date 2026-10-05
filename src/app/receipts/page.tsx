import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, leads, properties, receiptImports } from "@/db/schema";
import { requireAccess } from "@/lib/auth";
import { fmtDateOnly, money } from "@/lib/constants";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import ReceiptAssignmentForm from "@/components/ReceiptAssignmentForm";

export const dynamic = "force-dynamic";

type ReceiptFilter = "review" | "imported" | "all";

function customerName(
  firstName: string | null,
  lastName: string | null,
  fallback: string | null,
): string {
  return firstName
    ? `${firstName} ${lastName ?? ""}`.trim()
    : fallback ?? "(unnamed job)";
}

function jobLabel(values: {
  id: number;
  status: string | null;
  firstName: string | null;
  lastName: string | null;
  customerName: string | null;
  customerAddress: string | null;
  customerCity: string | null;
  leadAddress: string | null;
  leadCity: string | null;
  leadState: string | null;
  leadZip: string | null;
  propertyName: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
  unitNumber: string | null;
}): string {
  const name = customerName(values.firstName, values.lastName, values.customerName);
  const property = values.propertyName
    ? `${values.propertyName}${values.unitNumber ? ` · Unit ${values.unitNumber}` : ""}`
    : values.unitNumber
      ? `Unit ${values.unitNumber}`
      : null;
  const address = [
    values.propertyAddress ?? values.customerAddress ?? values.leadAddress,
    values.propertyCity ?? values.customerCity ?? values.leadCity,
    values.propertyState ?? values.leadState,
    values.propertyZip ?? values.leadZip,
  ]
    .filter(Boolean)
    .join(", ");
  const status = (values.status || "unknown").replaceAll("_", " ");
  return `Job #${values.id} · ${name}${property ? ` — ${property}` : ""} — ${address || "No address"} · Status: ${status}`;
}

function parseItems(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item)).filter((item) => item.trim() !== "")
      : [];
  } catch {
    return [];
  }
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tabClass(active: boolean): string {
  return `rounded-lg px-3 py-2 text-sm font-semibold ${
    active
      ? "bg-slate-900 text-white"
      : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
  }`;
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    assigned?: string;
    already?: string;
    expense?: string;
  }>;
}) {
  const user = await requireAccess("job_financials");
  const params = await searchParams;
  const filter: ReceiptFilter =
    params.status === "imported" || params.status === "all"
      ? params.status
      : "review";
  const statusCondition =
    filter === "all" ? undefined : eq(receiptImports.status, filter);

  const [receiptRows, jobRows, statusCounts] = await Promise.all([
    db
      .select({
        id: receiptImports.id,
        expenseId: receiptImports.expenseId,
        jobId: receiptImports.jobId,
        orderNumber: receiptImports.orderNumber,
        emailSubject: receiptImports.emailSubject,
        fileName: receiptImports.fileName,
        sizeBytes: receiptImports.sizeBytes,
        purchaseDate: receiptImports.purchaseDate,
        vendor: receiptImports.vendor,
        subtotal: receiptImports.subtotal,
        tax: receiptImports.tax,
        total: receiptImports.total,
        poJobName: receiptImports.poJobName,
        itemsJson: receiptImports.itemsJson,
        status: receiptImports.status,
        matchReason: receiptImports.matchReason,
        createdAt: receiptImports.createdAt,
        jobStatus: jobs.status,
        jobCustomerName: jobs.customerName,
        jobCustomerAddress: jobs.customerAddress,
        jobCustomerCity: jobs.customerCity,
        jobUnitNumber: jobs.unitNumber,
        firstName: leads.firstName,
        lastName: leads.lastName,
        leadAddress: leads.address,
        leadCity: leads.city,
        leadState: leads.state,
        leadZip: leads.zip,
        propertyName: properties.name,
        propertyAddress: properties.address,
        propertyCity: properties.city,
        propertyState: properties.state,
        propertyZip: properties.zip,
      })
      .from(receiptImports)
      .leftJoin(jobs, eq(receiptImports.jobId, jobs.id))
      .leftJoin(leads, eq(jobs.leadId, leads.id))
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .where(
        statusCondition
          ? and(eq(receiptImports.orgId, user.orgId), statusCondition)
          : eq(receiptImports.orgId, user.orgId),
      )
      .orderBy(desc(receiptImports.purchaseDate), desc(receiptImports.createdAt))
      .limit(250),
    db
      .select({
        id: jobs.id,
        status: jobs.status,
        customerName: jobs.customerName,
        customerAddress: jobs.customerAddress,
        customerCity: jobs.customerCity,
        unitNumber: jobs.unitNumber,
        firstName: leads.firstName,
        lastName: leads.lastName,
        leadAddress: leads.address,
        leadCity: leads.city,
        leadState: leads.state,
        leadZip: leads.zip,
        propertyName: properties.name,
        propertyAddress: properties.address,
        propertyCity: properties.city,
        propertyState: properties.state,
        propertyZip: properties.zip,
      })
      .from(jobs)
      .leftJoin(leads, eq(jobs.leadId, leads.id))
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .where(eq(jobs.orgId, user.orgId))
      .orderBy(desc(jobs.createdAt)),
    db
      .select({ status: receiptImports.status, value: count() })
      .from(receiptImports)
      .where(eq(receiptImports.orgId, user.orgId))
      .groupBy(receiptImports.status),
  ]);

  const counts = new Map(statusCounts.map((row) => [row.status, Number(row.value)]));
  const reviewCount = counts.get("review") ?? 0;
  const importedCount = counts.get("imported") ?? 0;
  const totalCount = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const jobOptions = jobRows.map((row) => ({
    id: row.id,
    label: jobLabel(row),
  }));

  return (
    <div>
      <PageHeader
        title="Receipt Inbox"
        subtitle="Parsed receipts import automatically when the job match is certain. Only exceptions need review."
        action={
          <Link
            href="/expenses"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Job Costs
          </Link>
        }
      />

      {params.assigned && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Receipt assigned and included in job profitability
          {params.expense ? ` as expense #${params.expense}` : ""}.
        </div>
      )}
      {params.already && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          That receipt was already handled. No duplicate expense was created.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Needs Review" value={reviewCount} accent="text-amber-600" />
        <StatCard label="Imported" value={importedCount} accent="text-emerald-600" />
        <StatCard label="Total Parsed" value={totalCount} accent="text-slate-900" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/receipts?status=review" className={tabClass(filter === "review")}>
          Needs Review ({reviewCount})
        </Link>
        <Link href="/receipts?status=imported" className={tabClass(filter === "imported")}>
          Imported ({importedCount})
        </Link>
        <Link href="/receipts?status=all" className={tabClass(filter === "all")}>
          All ({totalCount})
        </Link>
      </div>

      {receiptRows.length === 0 ? (
        <EmptyState
          message={
            filter === "review"
              ? "No receipts need review."
              : "No receipts are available in this view."
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {receiptRows.map((receipt) => {
            const items = parseItems(receipt.itemsJson);
            const importedJobLabel = receipt.jobId
              ? jobLabel({
                  id: receipt.jobId,
                  status: receipt.jobStatus,
                  firstName: receipt.firstName,
                  lastName: receipt.lastName,
                  customerName: receipt.jobCustomerName,
                  customerAddress: receipt.jobCustomerAddress,
                  customerCity: receipt.jobCustomerCity,
                  leadAddress: receipt.leadAddress,
                  leadCity: receipt.leadCity,
                  leadState: receipt.leadState,
                  leadZip: receipt.leadZip,
                  propertyName: receipt.propertyName,
                  propertyAddress: receipt.propertyAddress,
                  propertyCity: receipt.propertyCity,
                  propertyState: receipt.propertyState,
                  propertyZip: receipt.propertyZip,
                  unitNumber: receipt.jobUnitNumber,
                })
              : null;
            return (
              <Card key={receipt.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {receipt.orderNumber ? `Order ${receipt.orderNumber}` : "In-store receipt"}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {receipt.poJobName || "No PO / job label"}
                    </h2>
                  </div>
                  <Badge
                    className={
                      receipt.status === "imported"
                        ? "bg-emerald-100 text-emerald-700"
                        : receipt.status === "review"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }
                  >
                    {receipt.status === "review" ? "Needs Review" : receipt.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">Purchase date</p>
                    <p className="font-semibold text-slate-700">{fmtDateOnly(receipt.purchaseDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="font-semibold text-slate-900">{money(receipt.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Vendor</p>
                    <p className="font-semibold text-slate-700">{receipt.vendor || "Home Depot"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">PDF</p>
                    <p className="font-semibold text-slate-700">{fileSize(receipt.sizeBytes)}</p>
                  </div>
                </div>

                {receipt.matchReason && (
                  <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {receipt.matchReason}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/api/receipt-imports/${receipt.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    Open Original PDF
                  </a>
                  {receipt.status === "imported" && (
                    <Link
                      href="/expenses"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View Job Costs
                    </Link>
                  )}
                </div>

                {items.length > 0 && (
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-semibold text-slate-600">
                      Receipt items ({items.length})
                    </summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
                      {items.map((item, index) => (
                        <li key={`${receipt.id}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {receipt.status === "imported" && importedJobLabel && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs text-slate-400">Assigned job</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      {importedJobLabel}
                    </p>
                  </div>
                )}

                {receipt.status === "review" && (
                  <ReceiptAssignmentForm receiptImportId={receipt.id} jobs={jobOptions} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
