"use client";

import { useRef, useState } from "react";
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
        <label className={label}>Job *</label>
        <select name="jobId" required className={input} defaultValue="">
          <option value="" disabled>
            Select a job
          </option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
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