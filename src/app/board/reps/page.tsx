import { db } from "@/db";
import { reps, sales } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/constants";
import { inRange, nyPeriodStarts } from "@/lib/ny-dates";
import TvBoardChrome from "@/components/TvBoardChrome";

export const dynamic = "force-dynamic";

export default async function RepsBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ tight?: string }>;
}) {
  const user = await requireUser();
  const { tight: tightQ } = await searchParams;
  const tight = tightQ === "1";
  const { today, weekStart, monthStart } = nyPeriodStarts();

  const [saleRows, repRows] = await Promise.all([
    db.select().from(sales).where(eq(sales.orgId, user.orgId)),
    db.select().from(reps).where(eq(reps.orgId, user.orgId)),
  ]);

  const nameById = new Map(repRows.map((r) => [r.id, r.name]));

  type Agg = { name: string; today: number; week: number; month: number; deals: number };
  const byRep = new Map<number | "none", Agg>();

  const bump = (id: number | "none", amt: number, when: Date | string | null) => {
    const cur = byRep.get(id) ?? {
      name: id === "none" ? "Unassigned" : nameById.get(id) ?? "Rep",
      today: 0,
      week: 0,
      month: 0,
      deals: 0,
    };
    if (inRange(when, monthStart)) {
      cur.month += amt;
      cur.deals += 1;
    }
    if (inRange(when, weekStart)) cur.week += amt;
    if (inRange(when, today)) cur.today += amt;
    byRep.set(id, cur);
  };

  for (const s of saleRows) {
    bump(s.salesRepId ?? "none", Number(s.amount || 0), s.soldAt);
  }

  const ranked = [...byRep.values()].filter((r) => r.month > 0 || r.week > 0 || r.today > 0);
  ranked.sort((a, b) => b.month - a.month);
  const maxM = Math.max(...ranked.map((r) => r.month), 1);

  return (
    <TvBoardChrome
      title="TV Rep Board"
      tight={tight}
      right={
        <div className="text-right text-slate-400">
          Ranked by month
          <div className="text-white">{ranked.length} reps</div>
        </div>
      }
    >
      {ranked.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-slate-500">
          No sales in these windows yet.
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((r, i) => (
            <div
              key={r.name + i}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
            >
              <div className={`flex items-center gap-4 ${tight ? "px-3 py-2" : "px-5 py-3"}`}>
                <div
                  className={`grid place-items-center rounded-full font-bold ${
                    i === 0
                      ? "bg-amber-400 text-slate-950"
                      : i === 1
                        ? "bg-slate-300 text-slate-950"
                        : i === 2
                          ? "bg-orange-800 text-white"
                          : "bg-slate-800 text-slate-300"
                  } ${tight ? "h-8 w-8 text-sm" : "h-12 w-12 text-xl"}`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-bold ${tight ? "text-lg" : "text-2xl"}`}>{r.name}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${Math.max(4, (r.month / maxM) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <div className="text-[10px] uppercase text-slate-500">Today</div>
                    <div className="font-semibold text-cyan-300">{money(r.today)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500">Week</div>
                    <div className="font-semibold text-amber-300">{money(r.week)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500">Month</div>
                    <div className={`font-bold text-emerald-400 ${tight ? "text-lg" : "text-2xl"}`}>
                      {money(r.month)}
                    </div>
                    <div className="text-[10px] text-slate-500">{r.deals} deal{r.deals === 1 ? "" : "s"}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </TvBoardChrome>
  );
}
