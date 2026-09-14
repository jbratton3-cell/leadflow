"use client";

import { useState } from "react";
import {
  commitHcpPayments,
  previewHcpPayments,
  type HcpPaymentImportResult,
  type HcpPaymentPreview,
} from "@/lib/hcp-payment-actions";

const input =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400";

function isPreview(
  value: HcpPaymentPreview | { error: string },
): value is HcpPaymentPreview {
  return !("error" in value);
}

function isResult(
  value: HcpPaymentImportResult | { error: string },
): value is HcpPaymentImportResult {
  return !("error" in value);
}

function money(value: string) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function HcpPaymentsImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<HcpPaymentPreview | null>(null);
  const [result, setResult] = useState<HcpPaymentImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<"preview" | "commit" | null>(null);

  function buildFormData() {
    const formData = new FormData();
    if (file) formData.append("payments", file);
    return formData;
  }

  async function handlePreview() {
    setError(null);
    setResult(null);
    setWorking("preview");
    const response = await previewHcpPayments(buildFormData());
    setWorking(null);
    if (isPreview(response)) setPreview(response);
    else setError(response.error);
  }

  async function handleCommit() {
    setError(null);
    setWorking("commit");
    const response = await commitHcpPayments(buildFormData());
    setWorking(null);
    if (isResult(response)) setResult(response);
    else setError(response.error);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setWorking(null);
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-lg font-bold text-slate-800">HCP payments import complete</h3>
          <p className="mt-1 text-sm text-slate-600">
            {result.imported} new payment(s) imported for {money(result.totalAmount)}.
            {result.alreadyImported
              ? ` ${result.alreadyImported} already in LeadFlow were skipped.`
              : ""}
            {result.duplicateRows
              ? ` ${result.duplicateRows} duplicate row(s) in the file were skipped.`
              : ""}
          </p>
        </div>
        {result.issues.length > 0 && <IssueList issues={result.issues} />}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Import another payments file
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Import HCP payments only</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a detailed HCP payments export without re-importing customers, jobs,
          estimates, or invoices. Existing and repeated payments are skipped.
        </p>
      </div>

      <label className="block rounded-lg border border-slate-200 bg-slate-50 p-3">
        <span className="block text-sm font-semibold text-slate-700">Payments export</span>
        <span className="mt-0.5 block text-xs text-slate-400">
          Detailed payments CSV with Job ID, Customer ID, Invoice Number, date, and amount
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className={`${input} mt-2 text-xs`}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) {
              setFile(selected);
              setPreview(null);
              setResult(null);
              setError(null);
            }
          }}
        />
        {file && <span className="mt-1 block truncate text-xs text-emerald-700">{file.name}</span>}
      </label>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      {!preview ? (
        <button
          type="button"
          onClick={handlePreview}
          disabled={!file || working !== null}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {working === "preview" ? "Reading export…" : "Preview payment import"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Rows" value={preview.rows} />
            <Metric label="New payments" value={preview.newPayments} />
            <Metric label="Already imported" value={preview.alreadyImported} />
            <Metric label="Total amount" value={money(preview.totalAmount)} />
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Relationship checks</h3>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <div>Customers matched: <strong>{preview.matchedCustomers}</strong></div>
              <div>Jobs matched: <strong>{preview.matchedJobs}</strong></div>
              <div>Invoices matched: <strong>{preview.matchedInvoices}</strong></div>
              <div>Customers unmatched: <strong>{preview.unmatchedCustomers}</strong></div>
              <div>Jobs unmatched: <strong>{preview.unmatchedJobs}</strong></div>
              <div>Invoices unmatched: <strong>{preview.unmatchedInvoices}</strong></div>
            </div>
          </div>
          {preview.issues.length > 0 && <IssueList issues={preview.issues} />}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCommit}
              disabled={working !== null || preview.newPayments === 0}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working === "commit" ? "Importing…" : "Approve and import"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={working !== null}
              className="text-sm font-medium text-slate-500 hover:underline"
            >
              Choose a different file
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Unmatched payments are still preserved in LeadFlow with the original HCP
            customer and job identifiers for later review.
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function IssueList({ issues }: { issues: HcpPaymentPreview["issues"] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-900">Review before continuing</h3>
      <ul className="mt-2 space-y-1 text-xs text-amber-800">
        {issues.map((issue, index) => (
          <li key={`${issue.message}-${index}`}>
            <strong>{issue.severity === "error" ? "Required: " : "Review: "}</strong>
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}