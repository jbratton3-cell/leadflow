"use client";

import { useState } from "react";
import { importLeads, type ImportResult } from "@/lib/import-actions";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";

// Fields a CSV column can map to.
const TARGETS: { key: string; label: string }[] = [
  { key: "", label: "— Skip —" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "fullName", label: "Full Name (split)" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "altPhone", label: "Alt Phone" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
  { key: "source", label: "Lead Source" },
  { key: "product", label: "Product" },
  { key: "estimatedValue", label: "Estimated Value" },
  { key: "notes", label: "Notes" },
];

// Synonyms for auto-detecting column mappings.
const SYNONYMS: Record<string, string> = {
  firstname: "firstName",
  first: "firstName",
  fname: "firstName",
  lastname: "lastName",
  last: "lastName",
  lname: "lastName",
  surname: "lastName",
  name: "fullName",
  fullname: "fullName",
  customer: "fullName",
  customername: "fullName",
  contact: "fullName",
  email: "email",
  emailaddress: "email",
  phone: "phone",
  phonenumber: "phone",
  primaryphone: "phone",
  cell: "phone",
  mobile: "phone",
  homephone: "phone",
  altphone: "altPhone",
  secondaryphone: "altPhone",
  workphone: "altPhone",
  address: "address",
  street: "address",
  address1: "address",
  streetaddress: "address",
  city: "city",
  town: "city",
  state: "state",
  province: "state",
  region: "state",
  zip: "zip",
  zipcode: "zip",
  postalcode: "zip",
  postal: "zip",
  source: "source",
  leadsource: "source",
  campaign: "source",
  product: "product",
  productinterest: "product",
  service: "product",
  job: "product",
  value: "estimatedValue",
  estimatedvalue: "estimatedValue",
  amount: "estimatedValue",
  jobvalue: "estimatedValue",
  notes: "notes",
  note: "notes",
  comments: "notes",
  description: "notes",
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\r") {
        // ignore
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-empty trailing rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const BATCH = 200;

export default function ImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<string[]>([]);
  const [createMissing, setCreateMissing] = useState(true);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  function loadCsv(text: string) {
    setError(null);
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      setError("The file needs a header row plus at least one data row.");
      return;
    }
    const hdr = parsed[0].map((h) => h.trim());
    const body = parsed.slice(1);
    const autoMap = hdr.map((h) => SYNONYMS[norm(h)] ?? "");
    setHeaders(hdr);
    setDataRows(body);
    setMapping(autoMap);
    setStep(2);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    loadCsv(text);
  }

  const mappedCount = mapping.filter((m) => m).length;
  const hasName = mapping.some((m) => ["firstName", "lastName", "fullName"].includes(m));

  function buildRows(): Record<string, string>[] {
    return dataRows.map((r) => {
      const obj: Record<string, string> = {};
      mapping.forEach((target, i) => {
        if (target) obj[target] = (r[i] ?? "").trim();
      });
      return obj;
    });
  }

  async function runImport() {
    setImporting(true);
    setResult(null);
    setProgress(0);
    const rows = buildRows();
    const total: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const res = await importLeads({ rows: chunk, createMissing });
      total.imported += res.imported;
      total.skipped += res.skipped;
      total.errors.push(...res.errors);
      setProgress(Math.min(i + BATCH, rows.length));
    }

    setResult(total);
    setImporting(false);
    setStep(3);
  }

  function reset() {
    setStep(1);
    setHeaders([]);
    setDataRows([]);
    setMapping([]);
    setPasteText("");
    setResult(null);
    setProgress(0);
    setError(null);
  }

  function downloadTemplate() {
    const cols = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Zip",
      "Lead Source",
      "Product",
      "Estimated Value",
      "Notes",
    ];
    const sample = [
      "Jane,Doe,jane@example.com,(555) 123-4567,12 Oak St,Springfield,IL,62701,Google PPC,Roofing,18000,Wants a quote next week",
    ];
    const csv = [cols.join(","), ...sample].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leadflow-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------------- Step 1 ------------------------------- */
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="mb-2 text-3xl">📥</div>
          <p className="mb-4 text-sm text-slate-500">
            Upload a CSV file exported from your spreadsheet or previous CRM.
          </p>
          <label className="inline-block cursor-pointer rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
            Choose CSV File
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>
          <div className="mt-3">
            <button
              onClick={downloadTemplate}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              Download a template CSV
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-slate-500">
            …or paste CSV text directly
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder="First Name,Last Name,Email,Phone&#10;Jane,Doe,jane@example.com,(555) 123-4567"
            className={input}
          />
          <button
            onClick={() => loadCsv(pasteText)}
            disabled={!pasteText.trim()}
            className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Parse Pasted CSV
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        )}
      </div>
    );
  }

  /* ------------------------------- Step 2 ------------------------------- */
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Found <strong className="text-slate-700">{dataRows.length}</strong> rows. Match each
            column to a field below (we auto-matched what we could).
          </p>
          <button onClick={reset} className="text-xs font-medium text-slate-500 hover:underline">
            Start over
          </button>
        </div>

        {/* Column mapping */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">CSV Column</th>
                <th className="px-3 py-2 font-medium">Sample</th>
                <th className="px-3 py-2 font-medium">Maps To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {headers.map((h, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium text-slate-700">{h || `Column ${i + 1}`}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-slate-400">
                    {dataRows[0]?.[i] ?? ""}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={mapping[i] ?? ""}
                      onChange={(e) => {
                        const next = [...mapping];
                        next[i] = e.target.value;
                        setMapping(next);
                      }}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {TARGETS.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={createMissing}
            onChange={(e) => setCreateMissing(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Automatically create any lead sources or products that don&apos;t exist yet
        </label>

        {!hasName && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Map at least one name column (First/Last or Full Name) before importing.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={runImport}
            disabled={!hasName || mappedCount === 0 || importing}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {importing
              ? `Importing… ${progress}/${dataRows.length}`
              : `Import ${dataRows.length} Leads`}
          </button>
          <button onClick={reset} className="text-sm font-medium text-slate-500 hover:underline">
            Cancel
          </button>
        </div>

        {importing && (
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-400 transition-all"
              style={{ width: `${(progress / dataRows.length) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------- Step 3 ------------------------------- */
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mb-2 text-3xl">✅</div>
        <h3 className="text-lg font-bold text-slate-800">Import Complete</h3>
        <p className="mt-1 text-sm text-slate-600">
          <strong className="text-emerald-700">{result?.imported ?? 0}</strong> leads imported
          {result && result.skipped > 0 && (
            <>
              {" · "}
              <strong className="text-amber-700">{result.skipped}</strong> skipped
            </>
          )}
        </p>
      </div>

      {result && result.errors.length > 0 && (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Details ({result.errors.length})
          </div>
          <ul className="max-h-40 space-y-0.5 overflow-y-auto text-xs text-slate-500">
            {result.errors.slice(0, 50).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <a
          href="/leads"
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          View Imported Leads
        </a>
        <button
          onClick={reset}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}
