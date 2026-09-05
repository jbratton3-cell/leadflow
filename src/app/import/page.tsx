import { PageHeader, Card } from "@/components/ui";
import { requireAccess } from "@/lib/auth";
import ImportWizard from "@/components/ImportWizard";
import DuplicateCleanup from "@/components/DuplicateCleanup";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await requireAccess("import");

  return (
    <div>
      <PageHeader
        title="Import & Migrate Data"
        subtitle="Bring your existing leads into LeadFlow from a spreadsheet or another CRM."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ImportWizard />
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">How it works</h2>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="font-bold text-orange-500">1.</span>
              Export your contacts/leads from your current system as a{" "}
              <strong>CSV file</strong>.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-500">2.</span>
              Upload it here (or paste the data). We&apos;ll auto-detect the columns.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-500">3.</span>
              Review the column mapping and adjust anything that isn&apos;t right.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-500">4.</span>
              Import — new leads land in the <strong>New Lead</strong> stage, ready to work.
            </li>
          </ol>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <strong className="text-slate-600">Tip:</strong> Lead sources and products are
            matched by name. New ones can be created automatically during import, so your
            campaign attribution carries over.
          </div>
        </Card>
      </div>
      {(user.role === "admin" || user.role === "manager") && (
        <Card className="mt-6 p-6">
          <DuplicateCleanup />
        </Card>
      )}
    </div>
  );
}
