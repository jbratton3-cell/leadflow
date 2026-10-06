import Link from "next/link";
import LoginForm from "./LoginForm";
import { copyright, APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-2xl font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <h1 className="text-xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          {reset === "success" && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Password updated. Sign in with your new password.
            </div>
          )}
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">
          New here?{" "}
          <Link href="/contact" className="font-semibold text-orange-400 hover:underline">
            Get started
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">
          Home Improvement Sales &amp; Production Suite
        </p>
        <div className="mt-2 flex justify-center gap-3 text-[11px] text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
          <Link href="/cookies" className="hover:text-slate-300">Cookies</Link>
        </div>
        <p className="mt-1 text-center text-[11px] text-slate-600">{copyright()}</p>
      </div>
    </main>
  );
}
