import Link from "next/link";
import SignupForm from "@/app/signup/SignupForm";
import { copyright, APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Tour-first framing of the trial signup — same form, softer doorstep.
// /signup remains available for anyone carrying the original link.
export default function TourPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <h1 className="text-xl font-bold text-white">Take the 5-minute tour</h1>
          <p className="text-sm text-slate-400">
            Walk a real deal through {APP_NAME} — guided, step by step.
            No credit card. Nothing to install.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <p className="mb-4 text-xs leading-relaxed text-slate-500">
            Your tour saves as you go — the company name and password below just
            let you pause and come back. Nothing is shared, and sample data is
            one click to clear.
          </p>
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
