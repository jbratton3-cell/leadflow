"use client";

// Small print trigger for document-style pages (signed estimates, invoices).
export default function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
    >
      🖨 {label}
    </button>
  );
}
