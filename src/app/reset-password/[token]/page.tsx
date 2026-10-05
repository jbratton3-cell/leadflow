import Link from "next/link";
import { APP_NAME, copyright } from "@/lib/constants";
import { getPasswordResetStatus } from "@/lib/auth-actions";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await getPasswordResetStatus(token);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <h1 className="text-xl font-bold text-white">Choose a new password</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          {valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900">Reset link not valid</h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                This link is invalid, expired, or has already been used. Request a new one
                from the sign-in page.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Request a New Link
              </Link>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="font-semibold text-orange-400 hover:underline">
            Back to Sign In
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] text-slate-500">{copyright()}</p>
      </div>
    </main>
  );
}
