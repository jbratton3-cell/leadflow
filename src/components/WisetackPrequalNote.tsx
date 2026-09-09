export const WISETACK_PREQUAL_URL = "https://wisetack.us/#/kehyadc/prequalify";
export const WISETACK_FAQ_URL = "https://www.wisetack.com/faqs";

export function WisetackPrequalNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-2 text-[11px] leading-snug text-slate-600" : "mt-3 text-xs leading-relaxed text-slate-600"}>
      <a
        href={WISETACK_PREQUAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-orange-600 hover:underline"
      >
        Prequalify for financing without impacting your credit score*
      </a>
      <p className={compact ? "mt-1 text-[10px] text-slate-400" : "mt-1 text-[11px] text-slate-400"}>
        *All financing is subject to credit approval. Payment options through Wisetack are
        provided by our lending partners. See{" "}
        <a href={WISETACK_FAQ_URL} target="_blank" rel="noopener noreferrer" className="underline">
          wisetack.com/faqs
        </a>
        .
      </p>
    </div>
  );
}
