import { db } from "@/db";
import { reps, leadSources, products, users, invitations, demoRequests } from "@/db/schema";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { PageHeader, Card, Badge } from "@/components/ui";
import { createRep, createSource, createProduct } from "@/lib/actions";
import { updateUserRole, toggleUserActive, resendInvite, revokeInvite } from "@/lib/auth-actions";
import { requireAccess } from "@/lib/auth";
import { can, ROLES, roleLabel as userRoleLabel } from "@/lib/permissions";
import { deleteUser } from "@/lib/auth-actions";
import DeleteButton from "@/components/DeleteButton";
import { REP_ROLES, SOURCE_CATEGORIES, roleLabel, money, fmtDate } from "@/lib/constants";
import InvitePanel from "@/components/InvitePanel";
import CopyInviteLink from "@/components/CopyInviteLink";

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400";
const label = "mb-1 block text-xs font-medium text-slate-600";

export default async function SettingsPage() {
  const me = await requireAccess("settings");
  const orgId = me.orgId;
  const canManageUsers = can(me.role, "users");
  // Only the platform-owner org (#1) sees inbound sales leads from the marketing site.
  const isPlatformOwner = orgId === 1 && me.role === "admin";
  const demoRows = isPlatformOwner
    ? await db.select().from(demoRequests).orderBy(desc(demoRequests.createdAt)).limit(100)
    : [];

  const [repRows, sourceRows, productRows, userRows, inviteRows] = await Promise.all([
    db.select().from(reps).where(eq(reps.orgId, orgId)).orderBy(asc(reps.name)),
    db.select().from(leadSources).where(eq(leadSources.orgId, orgId)).orderBy(asc(leadSources.name)),
    db.select().from(products).where(eq(products.orgId, orgId)).orderBy(asc(products.name)),
    canManageUsers
      ? db.select().from(users).where(eq(users.orgId, orgId)).orderBy(asc(users.name))
      : Promise.resolve([]),
    canManageUsers
      ? db
          .select()
          .from(invitations)
          .where(and(eq(invitations.orgId, orgId), isNull(invitations.acceptedAt)))
          .orderBy(asc(invitations.createdAt))
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your team, lead sources, product lines, and user access."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team */}
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Team Members</h2>
          <form action={createRep} className="mb-4 space-y-2">
            <input name="name" placeholder="Full name" required className={input} />
            <input name="email" placeholder="Email" type="email" className={input} />
            <input name="phone" placeholder="Phone" className={input} />
            <select name="role" className={input} defaultValue="sales">
              {REP_ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
            <button className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Add Member
            </button>
          </form>
          <ul className="divide-y divide-slate-100">
            {repRows.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-slate-700">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.email ?? "—"}</div>
                </div>
                <Badge>{roleLabel(r.role)}</Badge>
              </li>
            ))}
            {repRows.length === 0 && <li className="py-2 text-sm text-slate-400">No members yet.</li>}
          </ul>
        </Card>

        {/* Lead Sources */}
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Lead Sources</h2>
          <form action={createSource} className="mb-4 space-y-2">
            <input name="name" placeholder="Source name" required className={input} />
            <select name="category" className={input} defaultValue="internet">
              {SOURCE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              name="monthlyCost"
              placeholder="Monthly spend ($)"
              type="number"
              step="0.01"
              className={input}
            />
            <button className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Add Source
            </button>
          </form>
          <ul className="divide-y divide-slate-100">
            {sourceRows.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-slate-700">{s.name}</div>
                  <div className="text-xs capitalize text-slate-400">
                    {s.category.replace("_", " ")}
                  </div>
                </div>
                <span className="text-sm text-slate-600">{money(s.monthlyCost)}/mo</span>
              </li>
            ))}
            {sourceRows.length === 0 && <li className="py-2 text-sm text-slate-400">No sources yet.</li>}
          </ul>
        </Card>

        {/* Products */}
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Product Lines</h2>
          <form action={createProduct} className="mb-4 space-y-2">
            <input name="name" placeholder="Product name" required className={input} />
            <input
              name="avgTicket"
              placeholder="Avg ticket ($)"
              type="number"
              step="0.01"
              className={input}
            />
            <button className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Add Product
            </button>
          </form>
          <ul className="divide-y divide-slate-100">
            {productRows.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div className="font-medium text-slate-700">{p.name}</div>
                <span className="text-sm text-slate-600">{money(p.avgTicket)}</span>
              </li>
            ))}
            {productRows.length === 0 && <li className="py-2 text-sm text-slate-400">No products yet.</li>}
          </ul>
        </Card>
      </div>

      {/* User Management & Security (admin only) */}
      {canManageUsers && (
        <div className="mt-6 space-y-6">
          {/* Invite + role reference */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-slate-700">Invite a User</h2>
              <p className="mb-4 text-xs text-slate-400">
                We&apos;ll email (and text, if a number is given) an invite link. They set
                their own password — you never see or store it.
              </p>
              <InvitePanel />
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Roles & Access</h2>
              <ul className="space-y-3">
                {ROLES.map((r) => (
                  <li key={r.key}>
                    <div className="text-sm font-semibold text-slate-700">{r.label}</div>
                    <div className="text-xs text-slate-400">{r.description}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Pending invitations */}
          {inviteRows.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Pending Invitations ({inviteRows.length})
              </h2>
              <ul className="divide-y divide-slate-100">
                {inviteRows.map((inv) => (
                  <li key={inv.token} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <div className="font-medium text-slate-700">{inv.name}</div>
                      <div className="text-xs text-slate-400">
                        {inv.email}
                        {inv.phone ? ` · ${inv.phone}` : ""} · invited {fmtDate(inv.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="capitalize">{userRoleLabel(inv.role)}</Badge>
                      <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      <CopyInviteLink token={inv.token} />
                      <form action={resendInvite}>
                        <input type="hidden" name="token" value={inv.token} />
                        <button className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          Resend
                        </button>
                      </form>
                      <form action={revokeInvite}>
                        <input type="hidden" name="token" value={inv.token} />
                        <button className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">
                          Revoke
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Active users */}
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Login Users</h2>
            <p className="mb-4 text-xs text-slate-400">
              People who can sign in. Change a role or disable access at any time.
            </p>
            <ul className="divide-y divide-slate-100">
              {userRows.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <div className="font-medium text-slate-700">
                      {u.name}
                      {u.id === me.id && (
                        <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!u.active && <Badge className="bg-rose-100 text-rose-700">Disabled</Badge>}
                    <form action={updateUserRole} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700">
                        Save
                      </button>
                    </form>
                    {u.id !== me.id && (
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                            u.active
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                    )}
                    {me.role === "admin" && u.id !== me.id && !u.active && (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <DeleteButton
                          label="Delete"
                          confirmText={`Permanently delete ${u.name}'s login? Their past sales and records stay, but they can never sign in again (even with Enable).`}
                        />
                      </form>
                    )}
                  </div>
                </li>
              ))}
              {userRows.length === 0 && (
                <li className="py-2 text-sm text-slate-400">No users yet.</li>
              )}
            </ul>
          </Card>
        </div>
      )}

      {/* Inbound sales leads (platform owner only) */}
      {isPlatformOwner && (
        <div className="mt-6">
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">
              Sales Leads — Pricing Requests ({demoRows.length})
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              People who submitted the &ldquo;Get Started / Contact Us&rdquo; form on your
              marketing site.
            </p>
            {demoRows.length === 0 ? (
              <p className="text-sm text-slate-400">No requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-2 font-medium">Name</th>
                      <th className="px-2 py-2 font-medium">Company</th>
                      <th className="px-2 py-2 font-medium">Contact</th>
                      <th className="px-2 py-2 font-medium">Trade</th>
                      <th className="px-2 py-2 font-medium">Message</th>
                      <th className="px-2 py-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {demoRows.map((d) => (
                      <tr key={d.id} className="align-top">
                        <td className="px-2 py-2 font-medium text-slate-700">{d.name}</td>
                        <td className="px-2 py-2 text-slate-600">{d.company ?? "—"}</td>
                        <td className="px-2 py-2 text-slate-600">
                          <div>{d.email}</div>
                          {d.phone && <div className="text-xs text-slate-400">{d.phone}</div>}
                        </td>
                        <td className="px-2 py-2 text-slate-600">{d.trade ?? "—"}</td>
                        <td className="max-w-[220px] px-2 py-2 text-slate-500">
                          {d.message ?? "—"}
                        </td>
                        <td className="px-2 py-2 text-xs text-slate-400">{fmtDate(d.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
