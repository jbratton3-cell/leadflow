"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/auth-actions";
import { ROLES } from "@/lib/permissions";

// Role dropdown that saves on change and holds its selection optimistically
// (no page refresh, no snap-back to the old value).
export default function RoleSelect({
  userId,
  currentRole,
}: {
  userId: number;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const prev = role;
    setRole(next); // optimistic: hold the new selection immediately
    setSaved(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(userId));
      fd.set("role", next);
      await updateUserRole(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <span className="flex items-center gap-1.5">
      <select
        value={role}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>
      {pending ? (
        <span className="text-[10px] text-slate-400">saving…</span>
      ) : saved ? (
        <span className="text-[10px] font-medium text-emerald-600">Saved ✓</span>
      ) : null}
    </span>
  );
}
