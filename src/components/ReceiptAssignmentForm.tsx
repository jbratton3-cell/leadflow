"use client";

import { useMemo, useState } from "react";
import { assignReceiptToJob } from "@/lib/receipt-import-actions";

type JobOption = {
  id: number;
  label: string;
};

export default function ReceiptAssignmentForm({
  receiptImportId,
  jobs,
}: {
  receiptImportId: number;
  jobs: JobOption[];
}) {
  const [query, setQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const matchingJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return jobs.slice(0, 8);
    return jobs
      .filter((job) => job.label.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [jobs, query]);

  function chooseJob(job: JobOption) {
    setQuery(job.label);
    setSelectedJobId(job.id);
    setOpen(false);
    setHighlightedIndex(0);
    setError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((index) =>
        matchingJobs.length === 0
          ? 0
          : Math.min(index + 1, matchingJobs.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && matchingJobs.length > 0) {
      event.preventDefault();
      chooseJob(matchingJobs[highlightedIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  async function submit(formData: FormData) {
    if (!selectedJobId) {
      setError("Choose a job from the matching results first.");
      setOpen(true);
      return;
    }
    formData.set("receiptImportId", String(receiptImportId));
    formData.set("jobId", String(selectedJobId));
    await assignReceiptToJob(formData);
  }

  return (
    <form action={submit} className="mt-4 border-t border-slate-200 pt-4">
      <input type="hidden" name="receiptImportId" value={receiptImportId} />
      <input type="hidden" name="jobId" value={selectedJobId ?? ""} />
      <label className="mb-1 block text-xs font-semibold text-slate-600">
        Assign to production job
      </label>
      <div className="relative">
        <input
          type="search"
          value={query}
          placeholder="Search customer, property, unit, or address…"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`receipt-job-options-${receiptImportId}`}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedJobId(null);
            setHighlightedIndex(0);
            setOpen(true);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
        />
        {open && (
          <div
            id={`receipt-job-options-${receiptImportId}`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {matchingJobs.length > 0 ? (
              matchingJobs.map((job, index) => (
                <button
                  key={job.id}
                  type="button"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseJob(job)}
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    index === highlightedIndex
                      ? "bg-orange-50 text-orange-800"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {job.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">
                No matching production job found.
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={!selectedJobId}
        className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Assign Receipt &amp; Create Expense
      </button>
      <p className="mt-2 text-xs text-slate-400">
        This attaches the stored PDF and immediately includes the amount in job profitability.
      </p>
    </form>
  );
}
