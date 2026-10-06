"use client";

import { useMemo, useState } from "react";

export default function PublicTourDemo({ slug }: { slug: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="rounded-md bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-400">
          Interactive sample · no login required
        </div>
      </div>
      <div className="bg-slate-100 p-3 text-slate-900 sm:p-5">
        {slug === "lead-management" && <LeadManagementDemo />}
        {slug === "estimates-and-signatures" && <EstimateDemo />}
        {slug === "payments-and-invoices" && <PaymentDemo />}
        {slug === "materials-and-production" && <ProductionDemo />}
        {slug === "job-costing-and-reports" && <JobCostingDemo />}
      </div>
    </div>
  );
}

function Frame({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">{eyebrow}</p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Sample data</span>
          LeadFlow
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LeadManagementDemo() {
  const stages = ["New", "Contacted", "Appointment Set", "Estimate Ready"];
  const [stage, setStage] = useState(0);

  return (
    <Frame eyebrow="Prospect workflow" title="Morgan Lee · Roof replacement">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Morgan Lee</p>
              <p className="mt-0.5 text-xs text-slate-500">18 Oak Ridge Drive · Referral</p>
            </div>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
              {stages[stage]}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Info label="Phone" value="(518) 555-0148" />
            <Info label="Assigned rep" value="Alex Rivera" />
            <Info label="Product" value="Roofing" />
            <Info label="Next action" value={stage < 2 ? "Schedule demo" : "Prepare estimate"} />
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <strong className="text-slate-800">Latest note:</strong> Customer wants architectural shingles and asked about financing options.
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Move the opportunity</p>
          <div className="mt-2 space-y-2">
            {stages.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setStage(index)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                  stage === index
                    ? "border-orange-300 bg-orange-50 text-orange-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                    index <= stage ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index < stage ? "✓" : index + 1}
                </span>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DemoNotice text="Try the stage buttons. In a configured workspace, permissions and automation follow your company’s workflow." />
    </Frame>
  );
}

function EstimateDemo() {
  const [view, setView] = useState<"office" | "customer">("office");
  const [accepted, setAccepted] = useState(false);

  return (
    <Frame eyebrow="Connected estimate" title="EST-2048 · Morgan Lee">
      <div className="mb-4 flex gap-2">
        {(["office", "customer"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${
              view === item ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600"
            }`}
          >
            {item} view
          </button>
        ))}
      </div>

      {view === "office" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
          <div className="rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold">Estimate items</div>
            <div className="divide-y divide-slate-100 text-sm">
              <Line label="Complete architectural roof system" value="$18,200.00" />
              <Line label="Decking allowance" value="$1,200.00" />
              <Line label="Permit and disposal" value="$850.00" />
            </div>
            <div className="flex justify-between bg-slate-50 px-4 py-3 font-bold">
              <span>Total</span><span>$20,250.00</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Job-site photos</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["Front slope", "Chimney", "Decking"].map((label, i) => (
                  <div key={label} className="grid aspect-square place-items-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-center text-[10px] font-semibold text-slate-600">
                    <span><span className="block text-xl">{["🏠", "🧱", "📷"][i]}</span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setView("customer")} className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
              Preview customer experience →
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-xl rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Your estimate is ready</p>
          <h4 className="mt-1 text-xl font-bold">Complete roof replacement</h4>
          <p className="mt-2 text-sm text-slate-600">Review the scope, included photos, terms, and available payment paths.</p>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm"><span>Project total</span><strong>$20,250.00</strong></div>
            <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Service location</span><span>18 Oak Ridge Drive</span></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setAccepted(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
              {accepted ? "✓ Accepted & signed" : "Accept & sign estimate"}
            </button>
            <button type="button" onClick={() => setView("office")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
              Back to office view
            </button>
          </div>
          {accepted && <p className="mt-3 text-xs font-semibold text-emerald-700" aria-live="polite">Signed record preserved. The connected sale, job, and invoice workflow can now begin.</p>}
        </div>
      )}
      <DemoNotice text="This sample is read-only. Real estimate fields, pricing choices, approvals, and terms are configured for each company." />
    </Frame>
  );
}

function PaymentDemo() {
  const methods = ["Cash / check", "Card / PayPal", "Financing"];
  const [method, setMethod] = useState(0);
  const [created, setCreated] = useState(false);

  return (
    <Frame eyebrow="Lead-to-cash workflow" title="Accepted estimate · $20,250.00">
      <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Choose a sample payment route</p>
          <div className="mt-3 space-y-2">
            {methods.map((item, index) => (
              <button key={item} type="button" onClick={() => { setMethod(index); setCreated(false); }} className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold ${method === index ? "border-orange-400 bg-orange-50 text-orange-800" : "border-slate-200 text-slate-600"}`}>
                <span className="mr-2">{method === index ? "●" : "○"}</span>{item}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setCreated(true)} className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
            Simulate acceptance
          </button>
        </div>
        <div className="rounded-xl bg-slate-900 p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-400">Connected results</p>
          <div className="mt-3 space-y-2 text-sm">
            <ResultRow label="Estimate" value="Accepted" active={created} />
            <ResultRow label="Sale" value="$20,250 recorded" active={created} />
            <ResultRow label="Production job" value="Created · Pending" active={created} />
            <ResultRow
              label={method === 2 ? "Financing" : "Deposit invoice"}
              value={method === 2 ? "Office follow-up requested" : "$10,125 created"}
              active={created}
            />
          </div>
          {created && (
            <div className="mt-4 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs leading-relaxed text-emerald-200" aria-live="polite">
              One customer decision updated every connected record. No duplicate customer or contract entry.
            </div>
          )}
        </div>
      </div>
      <DemoNotice text="Payment providers, invoice milestones, accounting handoffs, and financing steps are configured during implementation." />
    </Frame>
  );
}

function ProductionDemo() {
  const stages = ["Pending", "Permits", "Materials Ordered", "Scheduled", "In Progress", "Completed"];
  const [stage, setStage] = useState(2);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Frame eyebrow="Production handoff" title="Morgan Lee · 18 Oak Ridge Drive">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Job stage</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {stages.map((item, index) => (
              <button key={item} type="button" onClick={() => setStage(index)} className={`rounded-lg border px-3 py-2 text-left text-xs font-bold ${stage === index ? "border-orange-400 bg-orange-50 text-orange-800" : index < stage ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
                {index < stage ? "✓ " : ""}{item}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase text-slate-400">Milestones</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {["Measurements complete", "Permit approved", "Materials received", "Crew assigned"].map((item, index) => (
                <div key={item} className={`rounded-lg px-3 py-2 font-semibold ${index < Math.max(1, stage - 1) ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>
                  {index < Math.max(1, stage - 1) ? "✓" : "○"} {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-900 p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-400">Material order</p>
          <p className="mt-2 font-bold">Roofing package · ABC Supply</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li>✓ 28 squares architectural shingles</li>
            <li>✓ Synthetic underlayment</li>
            <li>✓ Ice and water barrier</li>
            <li>✓ Ridge vent and caps</li>
          </ul>
          <button type="button" onClick={() => setConfirmed(true)} className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
            {confirmed ? "✓ Supplier confirmed" : "Simulate supplier confirmation"}
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">The order stays connected to this job, address, supplier, and production status.</p>
        </div>
      </div>
    </Frame>
  );
}

function JobCostingDemo() {
  const baseExpenses = useMemo(() => [
    { label: "Roofing materials", amount: 8240 },
    { label: "Permit", amount: 325 },
    { label: "Dumpster", amount: 690 },
  ], []);
  const [receiptAdded, setReceiptAdded] = useState(false);
  const contract = 24800;
  const costs = baseExpenses.reduce((sum, item) => sum + item.amount, 0) + (receiptAdded ? 186.42 : 0);
  const profit = contract - costs;
  const margin = (profit / contract) * 100;

  return (
    <Frame eyebrow="Job profitability" title="Morgan Lee · Roof replacement">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold">Recorded job costs</div>
          <div className="divide-y divide-slate-100">
            {baseExpenses.map((item) => <Line key={item.label} label={item.label} value={money(item.amount)} />)}
            {receiptAdded && <Line label="Home Depot receipt" value="$186.42" />}
          </div>
          <div className="p-4">
            <button type="button" onClick={() => setReceiptAdded(!receiptAdded)} className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100">
              {receiptAdded ? "Remove sample receipt" : "Attach sample receipt expense"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Contract" value={money(contract)} />
          <Metric label="Costs" value={money(costs)} accent="text-rose-600" />
          <Metric label="Profit" value={money(profit)} accent="text-emerald-600" />
          <Metric label="Margin" value={`${margin.toFixed(1)}%`} accent="text-orange-600" />
          <div className="col-span-2 rounded-xl bg-slate-900 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-400">Company reporting</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniMetric label="Sold MTD" value="$284k" />
              <MiniMetric label="Collected" value="$191k" />
              <MiniMetric label="Estimates" value="31" />
            </div>
          </div>
        </div>
      </div>
      <DemoNotice text="Add or remove the sample receipt and watch profit update. Real receipts remain attached to their exact site-specific jobs." />
    </Frame>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-2.5"><p className="text-[10px] uppercase text-slate-400">{label}</p><p className="mt-0.5 font-semibold text-slate-700">{value}</p></div>;
}
function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm"><span className="text-slate-600">{label}</span><strong className="shrink-0 text-slate-900">{value}</strong></div>;
}
function ResultRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return <div className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${active ? "bg-emerald-500/15" : "bg-slate-800"}`}><span className="text-slate-300">{label}</span><span className={active ? "font-bold text-emerald-300" : "text-slate-500"}>{active ? "✓ " : "○ "}{value}</span></div>;
}
function Metric({ label, value, accent = "text-slate-900" }: { label: string; value: string; accent?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p></div>;
}
function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-800 px-2 py-3"><p className="text-[9px] uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
function DemoNotice({ text }: { text: string }) {
  return <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700">Try the controls above. {text}</p>;
}
function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}
