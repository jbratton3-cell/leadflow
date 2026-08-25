import { PageHeader, Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/permissions";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div>
      <PageHeader
        title="My Account"
        subtitle="Manage your personal login and password."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Name</dt>
              <dd className="font-medium text-slate-700">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Email</dt>
              <dd className="font-medium text-slate-700">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Role</dt>
              <dd className="font-medium text-slate-700">{roleLabel(user.role)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Change Password</h2>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
