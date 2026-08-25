"use client";

import { useEffect, useState } from "react";

// Builds the invite link from the CURRENT browser origin so it always matches
// the domain the admin is actually on, then offers a one-click copy button.
export default function CopyInviteLink({ token }: { token: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/invite/${token}` : "";

  return (
    <button
      type="button"
      onClick={() => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
      title={link}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
