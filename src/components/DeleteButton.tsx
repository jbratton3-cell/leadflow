"use client";

// A submit button that asks for confirmation before running a destructive
// server action. Use it inside a <form action={someDeleteAction}>.
export default function DeleteButton({
  label,
  confirmText,
  className,
}: {
  label: string;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      title="Delete"
      className={
        className ??
        "rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
      }
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
