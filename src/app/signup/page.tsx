import Link from "next/link";
import SignupForm from "./SignupForm";
import { copyright, APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <h1 className="text-xl font-bold text-white">Get started with {APP_NAME}</h1>
          <p className="text-sm text-slate-400">
            Create your company account.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <SignupForm />
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange-400 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-[11px] text-slate-600">{copyright()}</p>
      </div>
    </main>
  );
}
