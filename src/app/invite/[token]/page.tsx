import { getInvite } from "@/lib/auth-actions";
import { roleLabel } from "@/lib/permissions";
import { copyright, APP_NAME } from "@/lib/constants";
import AcceptForm from "./AcceptForm";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <h1 className="text-xl font-bold text-white">{APP_NAME}</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          {!invite ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900">Invitation not valid</h2>
              <p className="mt-2 text-sm text-slate-500">
                This invitation link is invalid, has expired, or has already been used.
                Please ask your administrator to send a new invite.
              </p>
              <a
                href="/login"
                className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Go to Sign In
              </a>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Welcome, {invite.name.split(" ")[0]}!
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set a password to activate your account.
                </p>
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400">Email:</span> {invite.email}
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span> {roleLabel(invite.role)}
                  </div>
                </div>
              </div>
              <AcceptForm token={invite.token} />
            </>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">{copyright()}</p>
      </div>
    </main>
  );
}
