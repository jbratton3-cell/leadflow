"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Periodically re-fetches server-rendered data without a full page reload.
// Shows a visible countdown so a TV display obviously stays live.
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    let nextAt = Date.now() + seconds * 1000;
    setRemaining(seconds);

    const tick = () => {
      const left = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000));
      if (left <= 0) {
        router.refresh();
        nextAt = Date.now() + seconds * 1000;
        setRemaining(seconds);
      } else {
        setRemaining(left);
      }
    };

    const id = setInterval(tick, 1000);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    let lock: WakeLockSentinel | null = null;
    const grabLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Cast / permissions — ignore
      }
    };
    void grabLock();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void grabLock();
    });

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [router, seconds]);

  return (
    <div className="pb-2 text-center text-xs text-slate-500">
      ↻ Auto-updates every minute — refreshing in {remaining}s
    </div>
  );
}
