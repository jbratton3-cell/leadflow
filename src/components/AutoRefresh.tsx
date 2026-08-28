"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Periodically re-fetches server-rendered data without a full page reload.
// Shows a visible countdown so a TV display obviously stays live.
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          router.refresh();
          return seconds;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [router, seconds]);

  return (
    <div className="pb-2 text-center text-xs text-slate-500">
      ↻ Auto-updates every minute — refreshing in {remaining}s
    </div>
  );
}
