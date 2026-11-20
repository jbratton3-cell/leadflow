import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { callLogs, type Lead } from "@/db/schema";
import { Card, PageHeader } from "@/components/ui";
import DispositionForm from "@/components/DispositionForm";
import { getCallReps, getSalesReps } from "@/lib/queries";
import { accountDisplayName, dispositionLabel, fmtDateTime, personName } from "@/lib/constants";

// A limited caller view deliberately does not query or render financial data.
export default async function CallerLeadDetail({ lead }: { lead: Lead }) {
  const [calls, callReps, salesReps] = await Promise.all([
    db.select().from(callLogs)
      .where(and(eq(callLogs.orgId, lead.orgId), eq(callLogs.leadId, lead.id)))
      .orderBy(desc(callLogs.createdAt)),
    getCallReps(),
    getSalesReps(),
  ]);
  const name = accountDisplayName(lead.firstName, lead.lastName, lead.company, lead.accountType);
  const contact = personName(lead.firstName, lead.lastName, "");

  return (
    <div>
      <PageHeader title={name} subtitle={[lead.city, lead.state].filter(Boolean).join(", ") || "Prospect"} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Contact</h2>
          {lead.company && <p className="text-sm text-slate-700"><strong>Company:</strong> {lead.company}</p>}
          {contact && contact !== name && <p className="mt-1 text-sm text-slate-700"><strong>Contact:</strong> {contact}</p>}
          <p className="mt-1 text-sm text-slate-700"><strong>Phone:</strong>{" "}
            {lead.phone ? <a className="text-orange-600 hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a> : "Not provided"}
          </p>
          {lead.email && <p className="mt-1 text-sm text-slate-700"><strong>Email:</strong> {lead.email}</p>}
          {lead.doNotCall && <p className="mt-2 font-semibold text-rose-700">Do not call</p>}
          {lead.notes && <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{lead.notes}</div>}
          <Link href="/call-center" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:underline">Back to Call Center</Link>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Call History</h2>
          {calls.length === 0 ? <p className="text-sm text-slate-400">No calls logged yet.</p> : (
            <ul className="space-y-3 text-sm text-slate-600">
              {calls.map((call) => <li key={call.id}>
                <div className="font-medium">{dispositionLabel(call.disposition)}</div>
                <div className="text-xs text-slate-400">{fmtDateTime(call.createdAt)}</div>
                {call.notes && <p className="mt-1 whitespace-pre-wrap">{call.notes}</p>}
              </li>)}
            </ul>
          )}
        </Card>
        {!lead.doNotCall && <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Log a Call</h2>
          <DispositionForm leadId={lead.id} callReps={callReps} salesReps={salesReps} defaultRepId={lead.assignedRepId} defaultSalesRepId={lead.assignedRepId} />
        </Card>}
      </div>
    </div>
  );
}
