"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Refreshes server data on an interval so the TV board stays current all day,
// and shows a live clock.
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const clock = setInterval(() => setNow(new Date()), 1000);
    const refresh = setInterval(() => router.refresh(), seconds * 1000);
    return () => {
      clearInterval(clock);
      clearInterval(refresh);
    };
  }, [router, seconds]);

  return (
    <div className="text-right leading-tight">
      <div className="text-3xl font-bold tabular-nums text-white">
        {now
          ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : "--:--"}
      </div>
      <div className="text-sm text-slate-400">
        {now
          ? now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : ""}
      </div>
    </div>
  );
}
