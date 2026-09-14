"use client";

import { useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { createExpense } from "@/lib/expense-actions";

type JobOption = {
  id: number;
  label: string;
};

type ReceiptUpload = {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default function ExpenseForm({
  jobs,
  categories,
  defaultDate,
}: {
  jobs: JobOption[];
  categories: { key: string; label: string }[];
  defaultDate: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [receipt, setReceipt] = useState<ReceiptUpload | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobQuery, setJobQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobPickerOpen, setJobPickerOpen] = useState(false);
  const [highlightedJobIndex, setHighlightedJobIndex] = useState(0);

  const matchingJobs = useMemo(() => {
    const query = jobQuery.trim().toLowerCase();
    if (!query) return jobs.slice(0, 8);
    return jobs
      .filter((job) => job.label.toLowerCase().includes(query))
      .slice(0, 8);
  }, [jobQuery, jobs]);

  function chooseJob(job: JobOption) {
    setSelectedJobId(job.id);
    setJobQuery(job.label);
    setJobPickerOpen(false);
    setHighlightedJobIndex(0);
    setError(null);
  }

  function handleJobKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setJobPickerOpen(true);
      setHighlightedJobIndex((index) =>
        matchingJobs.length === 0 ? 0 : Math.min(index + 1, matchingJobs.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedJobIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && jobPickerOpen && matchingJobs.length > 0) {
      event.preventDefault();
      chooseJob(matchingJobs[highlightedJobIndex]);
    } else if (event.key === "Escape") {
      setJobPickerOpen(false);
    }
  }

  async function uploadReceipt() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setReceipt(null);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/file-upload",
      });
      setReceipt({
        url: blob.url,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
    } catch (err) {
      setReceipt(null);
      setError((err as Error).message || "Receipt upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(formData: FormData) {
    if (uploading) {
      setError("Please wait for the receipt upload to finish.");
      return;
    }
    if (!selectedJobId) {
      setError("Select a job from the suggestions before saving the expense.");
      setJobPickerOpen(true);
      return;
    }
    formData.set("jobId", String(selectedJobId));
    if (receipt) {
      formData.set("receiptUrl", receipt.url);
      formData.set("receiptFileName", receipt.fileName);
      formData.set("receiptMimeType", receipt.mimeType);
      formData.set("receiptSizeBytes", String(receipt.sizeBytes));
    }
    await createExpense(formData);
  }

  return (
    <form action={submit} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className={label} htmlFor="expense-job-search">
          Job *
        </label>
        <div className="relative">
          <input
            id="expense-job-search"
            type="search"
            value={jobQuery}
            placeholder="Type a customer name or address…"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={jobPickerOpen}
            aria-controls="expense-job-suggestions"
            onFocus={() => setJobPickerOpen(true)}
            onChange={(event) => {
              setJobQuery(event.target.value);
              setSelectedJobId(null);
              setHighlightedJobIndex(0);
              setJobPickerOpen(true);
              setError(null);
            }}
            onKeyDown={handleJobKeyDown}
            className={input}
          />
          <input type="hidden" name="jobId" value={selectedJobId ?? ""} />
          {jobPickerOpen && (
            <div
              id="expense-job-suggestions"
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {matchingJobs.length > 0 ? (
                matchingJobs.map((job, index) => (
                  <button
                    key={job.id}
                    type="button"
                    role="option"
                    aria-selected={index === highlightedJobIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseJob(job)}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      index === highlightedJobIndex ? "bg-orange-50 text-orange-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {job.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">No matching jobs found.</div>
              )}
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">Choose a suggestion to link the expense to the job.</p>
      </div>
      <div>
        <label className={label}>Expense Category *</label>
        <select name="category" required className={input} defaultValue="materials_purchase">
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Amount *</label>
        <input name="amount" required type="number" min="0.01" step="0.01" className={input} />
      </div>
      <div>
        <label className={label}>Purchase Date *</label>
        <input name="purchaseDate" required type="date" defaultValue={defaultDate} className={input} />
      </div>
      <div>
        <label className={label}>Vendor</label>
        <input name="vendor" placeholder="Home Depot, Lowe’s, ABC Supply…" className={input} />
      </div>
      <div>
        <label className={label}>Paid By / Purchased By</label>
        <input name="paidBy" placeholder="Rep, installer, company card…" className={input} />
      </div>
      <div className="md:col-span-2">
        <label className={label}>Receipt</label>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
          onChange={uploadReceipt}
          className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
        />
        <p className="mt-1 text-xs text-slate-400">
          Optional now; future receipt reading can use this same upload.
        </p>
        {uploading && <p className="mt-1 text-xs font-medium text-orange-600">Uploading receipt…</p>}
        {receipt && !uploading && (
          <p className="mt-1 text-xs font-medium text-emerald-600">Receipt attached: {receipt.fileName}</p>
        )}
        {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <div className="md:col-span-2">
        <label className={label}>Notes</label>
        <textarea name="notes" rows={2} className={input} placeholder="What was purchased or why was it needed?" />
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={uploading || jobs.length === 0}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading receipt…" : "Save Expense"}
        </button>
      </div>
    </form>
  );
}