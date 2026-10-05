import Link from "next/link";
import { APP_NAME, copyright } from "@/lib/constants";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <h1 className="text-xl font-bold text-white">Reset your password</h1>
          <p className="text-sm text-slate-400">
            Enter the email used for your LeadFlow account.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <ForgotPasswordForm />
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
