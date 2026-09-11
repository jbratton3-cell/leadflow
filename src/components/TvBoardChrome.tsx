import AutoRefresh from "@/components/AutoRefresh";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export default function TvBoardChrome({
  title,
  tight,
  children,
  right,
}: {
  title: string;
  tight?: boolean;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const q = tight ? "?tight=1" : "";
  return (
    <main className={`min-h-screen bg-slate-950 text-white ${tight ? "text-[13px]" : ""}`}>
      <div className={`border-b border-slate-800 bg-slate-900/95 ${tight ? "px-4 py-2" : "px-6 py-4"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid place-items-center rounded-xl bg-orange-500 font-bold text-white ${
                tight ? "h-8 w-8 text-lg" : "h-12 w-12 text-2xl"
              }`}
            >
              {APP_NAME.slice(0, 1)}
            </div>
            <div>
              <div className={`font-bold tracking-tight ${tight ? "text-lg" : "text-2xl"}`}>{APP_NAME}</div>
              <div className="text-slate-400">{title}</div>
            </div>
          </div>
          {right}
        </div>
        <nav className={`flex flex-wrap gap-3 text-orange-400 ${tight ? "mt-1 text-[11px]" : "mt-2 text-sm"}`}>
          <Link href={`/board${q}`}>Jobs</Link>
          <Link href={`/board/sales${q}`}>Revenue</Link>
          <Link href={`/board/reps${q}`}>Reps</Link>
          {tight ? (
            <Link href="?" className="text-slate-500">
              Larger
            </Link>
          ) : (
            <Link href="?tight=1" className="text-slate-500">
              Tighter
            </Link>
          )}
        </nav>
      </div>
      <div className={tight ? "p-3" : "p-5"}>{children}</div>
      <AutoRefresh seconds={60} />
    </main>
  );
}
