import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { can, type Permission } from "@/lib/permissions";

const COOKIE_NAME = "session";
const SESSION_DAYS = 7;

/* --------------------------- password hashing --------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return timingSafeEqual(hashBuf, testBuf);
}

/* ------------------------------ sessions ------------------------------- */

// Create a session row + set the HTTP-only cookie. Call from a server action.
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);

  await db.insert(sessions).values({ token, userId, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Remove the current session (logout). Call from a server action.
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(COOKIE_NAME);
}

// Read the current logged-in user (or null). Safe in server components.
export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      orgId: users.orgId,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row || !row.active) return null;

  return { id: row.id, orgId: row.orgId, name: row.name, email: row.email, role: row.role };
}

// Opportunistic cleanup of expired sessions.
export async function purgeExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

// Require a logged-in user (redirect to /login otherwise).
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// Require a specific permission. Redirects unauthorized users to the dashboard.
export async function requireAccess(perm: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, perm)) redirect("/dashboard?denied=1");
  return user;
}
