"use client";

import { useState } from "react";

export default function CopyEstimateLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/estimate/${token}`;

  async function copyLink() {
    const link = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={path}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
      >
        Open Customer Link
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
      >
        {copied ? "Copied!" : "Copy Customer Link"}
      </button>
    </div>
  );
}