"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, invitations, organizations } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  requireAccess,
  getSessionUser,
} from "@/lib/auth";
import {
  sendEmail,
  sendSms,
  inviteEmailHtml,
  getBaseUrl,
} from "@/lib/notify";
import { ROLE_PERMISSIONS, type Role } from "@/lib/permissions";

function str(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

const INVITE_DAYS = 7;

/* -------------------------------- login -------------------------------- */

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (
    !user ||
    !user.active ||
    !user.passwordHash ||
    !verifyPassword(password, user.passwordHash)
  ) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/* ------------------------------ invitations ---------------------------- */

// Admin invites a user. Generates a token, tries email/SMS, returns the link.
export async function createInvite(
  _prev: { link?: string; message?: string; error?: string } | undefined,
  formData: FormData
): Promise<{ link?: string; message?: string; error?: string }> {
  const admin = await requireAccess("users");

  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const phone = str(formData.get("phone"));
  const role = (str(formData.get("role")) || "agent") as Role;

  if (!name || !email) {
    return { error: "Name and email are required." };
  }
  if (!ROLE_PERMISSIONS[role]) {
    return { error: "Invalid role." };
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return { error: "A user with that email already exists." };
  }

  // Remove any prior pending invite for this email
  await db.delete(invitations).where(eq(invitations.email, email));

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400000);
  const link = `${getBaseUrl()}/invite/${token}`;

  // Try delivery (best-effort; falls back to shareable link)
  let deliveredVia: "email" | "sms" | "link" = "link";
  const emailed = await sendEmail({
    to: email,
    subject: "You're invited to LeadFlow",
    html: inviteEmailHtml(name, link),
  });
  if (emailed) deliveredVia = "email";

  let smsed = false;
  if (phone) {
    smsed = await sendSms({
      to: phone,
      body: `${admin.name} invited you to LeadFlow. Set your password: ${link}`,
    });
    if (smsed && !emailed) deliveredVia = "sms";
  }

  await db.insert(invitations).values({
    token,
    orgId: admin.orgId,
    name,
    email,
    phone: phone || null,
    role,
    invitedById: admin.id,
    deliveredVia,
    expiresAt,
  });

  revalidatePath("/settings");

  const channels: string[] = [];
  if (emailed) channels.push("email");
  if (smsed) channels.push("text");
  const message =
    channels.length > 0
      ? `Invitation sent via ${channels.join(" & ")}. You can also share the link below.`
      : "Email/SMS not configured — share this invite link directly:";

  return { link, message };
}

export async function resendInvite(formData: FormData) {
  await requireAccess("users");
  const token = str(formData.get("token"));
  const rows = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  const inv = rows[0];
  if (!inv || inv.acceptedAt) return;

  const link = `${getBaseUrl()}/invite/${inv.token}`;
  await sendEmail({
    to: inv.email,
    subject: "Your LeadFlow invitation",
    html: inviteEmailHtml(inv.name, link),
  });
  if (inv.phone) {
    await sendSms({
      to: inv.phone,
      body: `Reminder: set your LeadFlow password: ${link}`,
    });
  }
  revalidatePath("/settings");
}

export async function revokeInvite(formData: FormData) {
  await requireAccess("users");
  const token = str(formData.get("token"));
  await db.delete(invitations).where(eq(invitations.token, token));
  revalidatePath("/settings");
}

// Look up a valid, pending invite by token (used by the accept page).
export async function getInvite(token: string) {
  const rows = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.token, token), isNull(invitations.acceptedAt)))
    .limit(1);
  const inv = rows[0];
  if (!inv) return null;
  if (new Date(inv.expiresAt) < new Date()) return null;
  return inv;
}

// Invitee sets their password → creates the account and logs them in.
export async function acceptInvite(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const token = str(formData.get("token"));
  const password = str(formData.get("password"));
  const confirm = str(formData.get("confirm"));

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const inv = await getInvite(token);
  if (!inv) {
    return { error: "This invitation is invalid or has expired." };
  }

  // Guard against a race where the email was claimed meanwhile
  const dup = await db.select().from(users).where(eq(users.email, inv.email)).limit(1);
  if (dup[0]) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const inserted = await db
    .insert(users)
    .values({
      orgId: inv.orgId,
      name: inv.name,
      email: inv.email,
      phone: inv.phone,
      role: inv.role,
      passwordHash: hashPassword(password),
      active: true,
    })
    .returning();

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.token, token));

  const user = inserted[0];
  if (user) await createSession(user.id);
  redirect("/dashboard");
}

/* --------------------------- user management --------------------------- */

export async function updateUserRole(formData: FormData) {
  const admin = await requireAccess("users");
  const id = Number(formData.get("id"));
  const role = str(formData.get("role")) as Role;
  if (!ROLE_PERMISSIONS[role]) return;
  // Scope to the admin's own organization.
  await db
    .update(users)
    .set({ role })
    .where(and(eq(users.id, id), eq(users.orgId, admin.orgId)));
  revalidatePath("/settings");
}

export async function toggleUserActive(formData: FormData) {
  const admin = await requireAccess("users");
  const id = Number(formData.get("id"));
  if (id === admin.id) return; // don't lock yourself out
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.orgId, admin.orgId)))
    .limit(1);
  const u = rows[0];
  if (!u) return;
  await db
    .update(users)
    .set({ active: !u.active })
    .where(and(eq(users.id, id), eq(users.orgId, admin.orgId)));
  revalidatePath("/settings");
}

// Current user changes their own password.
export async function changeOwnPassword(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in." };

  const current = str(formData.get("current"));
  const next = str(formData.get("next"));
  const confirm = str(formData.get("confirm"));

  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };

  const rows = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  const u = rows[0];
  if (!u || !verifyPassword(current, u.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, me.id));
  return { success: "Password updated." };
}

/* ------------------------ self-serve signup (SaaS) --------------------- */

// Creates a brand-new organization + its first admin user, then logs them in.
export async function signup(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const company = str(formData.get("company"));
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!company || !name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const dup = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (dup[0]) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const [org] = await db
    .insert(organizations)
    .values({ name: company, plan: "trial" })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      orgId: org.id,
      name,
      email,
      role: "admin",
      passwordHash: hashPassword(password),
      active: true,
    })
    .returning();

  if (user) await createSession(user.id);
  redirect("/dashboard");
}
