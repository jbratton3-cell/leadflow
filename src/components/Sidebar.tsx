"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth-actions";
import { can, type Permission } from "@/lib/permissions";
import { copyright, APP_NAME, BUSINESS_NAME } from "@/lib/constants";

const NAV: { href: string; label: string; icon: string; perm: Permission }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", perm: "dashboard" },
  { href: "/leads", label: "Prospects", icon: "👥", perm: "leads" },
  { href: "/call-center", label: "Call Center", icon: "📞", perm: "call_center" },
  { href: "/appointments", label: "Appointments", icon: "📅", perm: "appointments" },
  { href: "/estimates", label: "Estimates", icon: "📝", perm: "estimates" },
  { href: "/invoices", label: "Invoices", icon: "🧾", perm: "invoices" },
  { href: "/sales", label: "Sales", icon: "💰", perm: "sales" },
  { href: "/production", label: "Production", icon: "🏗️", perm: "production" },
  { href: "/marketing", label: "Marketing", icon: "📈", perm: "marketing" },
  { href: "/metrics", label: "Metrics", icon: "🎯", perm: "reports" },
  { href: "/reports", label: "Reports", icon: "📑", perm: "reports" },
  { href: "/import", label: "Import Data", icon: "📥", perm: "import" },
  { href: "/settings", label: "Settings", icon: "⚙️", perm: "settings" },
];

export default function Sidebar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = NAV.filter((item) => can(userRole, item.perm));

  const closeMenu = () => setOpen(false);

  const navLinks = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={closeMenu}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(item.href)
              ? "bg-orange-500 text-white"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-800 px-4 py-4">
      <Link
        href="/account"
        onClick={closeMenu}
        className={`mb-2 flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-slate-800 ${
          isActive("/account") ? "bg-slate-800" : ""
        }`}
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white">
          {userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-xs font-semibold text-white">{userName}</div>
          <div className="text-[10px] capitalize text-slate-400">{userRole} · My Account</div>
        </div>
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-rose-600 hover:text-white"
        >
          Sign Out
        </button>
      </form>
      <p className="mt-3 text-center text-[10px] leading-tight text-slate-500">
        {copyright()}
      </p>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-900 text-slate-200 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
              {APP_NAME.slice(0, 1)}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">{APP_NAME}</div>
              <div className="text-[11px] text-slate-400">by {BUSINESS_NAME}</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-white"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-slate-200 transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" onClick={closeMenu} className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
              {APP_NAME.slice(0, 1)}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">{APP_NAME}</div>
              <div className="text-[11px] text-slate-400">by {BUSINESS_NAME}</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMenu}
            className="rounded-lg border border-slate-700 px-3 py-2 text-white"
          >
            ✕
          </button>
        </div>

        {navLinks}
        {footer}
      </aside>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 text-slate-200 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 hover:bg-slate-800">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg font-bold text-white">
            {APP_NAME.slice(0, 1)}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">{APP_NAME}</div>
            <div className="text-[11px] text-slate-400">by {BUSINESS_NAME}</div>
          </div>
        </Link>

        {navLinks}
        {footer}
      </aside>
    </>
  );
}
