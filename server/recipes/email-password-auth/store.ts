// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { and, count, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { authUsers, type AuthUserRow } from '../../db/email-password-auth.schema.js';
import type { Role } from './roles.generated.js';

export type { Role } from './roles.generated.js';
export type Status = 'active' | 'disabled';

export interface PublicUser {
  id: string;
  /** `null` for an account created from a phone number alone. */
  email: string | null;
  /** E.164, `null` unless the account was created or linked by phone. */
  phone: string | null;
  name: string | null;
  role: Role;
  status: Status;
  createdAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Something to call a user by, whichever credential they signed up with. */
export function displayName(user: PublicUser): string {
  return user.name ?? user.email ?? user.phone ?? 'Account';
}

export function publicUser(row: AuthUserRow): PublicUser {
  return {
    id: row.authId,
    email: row.authEmail,
    phone: row.authPhone,
    name: row.authName,
    role: row.authRole as Role,
    status: row.authStatus as Status,
    createdAt: row.authCreatedAt.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<AuthUserRow | null> {
  const [row] = await db.select().from(authUsers).where(eq(authUsers.authEmail, normalizeEmail(email))).limit(1);
  return row ?? null;
}

export async function findUserById(id: string): Promise<AuthUserRow | null> {
  const [row] = await db.select().from(authUsers).where(eq(authUsers.authId, id)).limit(1);
  return row ?? null;
}

/** `phone` must already be E.164 — normalise with `phone-otp-auth`'s `normalizePhone` first. */
export async function findUserByPhone(phone: string): Promise<AuthUserRow | null> {
  const [row] = await db.select().from(authUsers).where(eq(authUsers.authPhone, phone)).limit(1);
  return row ?? null;
}

/**
 * At least one credential must be present. Both are nullable columns, so an
 * account with neither would be unreachable by every sign-in path — a row
 * nobody could ever log into.
 */
export async function createUser(input: {
  email?: string | null;
  phone?: string | null;
  passwordHash: string | null;
  name?: string | null;
  role: Role;
}): Promise<AuthUserRow> {
  if (!input.email && !input.phone) {
    throw Object.assign(new Error('An account needs an email or a phone number'), { statusCode: 400, code: 'validation' });
  }
  const [row] = await db
    .insert(authUsers)
    .values({
      authEmail: input.email ? normalizeEmail(input.email) : null,
      authPhone: input.phone ?? null,
      authPasswordHash: input.passwordHash,
      authName: input.name ?? null,
      authRole: input.role,
    })
    .returning();
  return row!;
}

/** Links a verified phone to an account that has none. Used by `phone-otp-auth`. */
export async function setPhone(id: string, phone: string): Promise<void> {
  await db.update(authUsers).set({ authPhone: phone, authUpdatedAt: new Date() }).where(eq(authUsers.authId, id));
}

export async function updateProfile(id: string, patch: { name?: string | null }): Promise<AuthUserRow | null> {
  const [row] = await db
    .update(authUsers)
    .set({ ...(patch.name !== undefined ? { authName: patch.name } : {}), authUpdatedAt: new Date() })
    .where(eq(authUsers.authId, id))
    .returning();
  return row ?? null;
}

/** Bumps the token version: every existing access + refresh token dies. */
export async function setPasswordHash(id: string, hash: string): Promise<void> {
  await db
    .update(authUsers)
    .set({ authPasswordHash: hash, authTokenVersion: sql`${authUsers.authTokenVersion} + 1`, authUpdatedAt: new Date() })
    .where(eq(authUsers.authId, id));
}

export async function bumpTokenVersion(id: string): Promise<void> {
  await db
    .update(authUsers)
    .set({ authTokenVersion: sql`${authUsers.authTokenVersion} + 1`, authUpdatedAt: new Date() })
    .where(eq(authUsers.authId, id));
}

export async function setRole(id: string, role: Role): Promise<void> {
  await db.update(authUsers).set({ authRole: role, authUpdatedAt: new Date() }).where(eq(authUsers.authId, id));
}

/** Disabling also bumps the token version so live sessions end immediately. */
export async function setStatus(id: string, status: Status): Promise<void> {
  await db
    .update(authUsers)
    .set({ authStatus: status, authTokenVersion: sql`${authUsers.authTokenVersion} + 1`, authUpdatedAt: new Date() })
    .where(eq(authUsers.authId, id));
}

export async function touchLogin(id: string): Promise<void> {
  await db.update(authUsers).set({ authLastLoginAt: new Date() }).where(eq(authUsers.authId, id));
}

export async function countUsers(): Promise<number> {
  const [r] = await db.select({ n: count() }).from(authUsers);
  return Number(r?.n ?? 0);
}

export async function countActiveAdmins(): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(authUsers)
    .where(and(eq(authUsers.authRole, 'admin'), eq(authUsers.authStatus, 'active')));
  return Number(r?.n ?? 0);
}

export async function countUsersSince(since: Date): Promise<number> {
  const [r] = await db.select({ n: count() }).from(authUsers).where(gte(authUsers.authCreatedAt, since));
  return Number(r?.n ?? 0);
}

export async function listUsers(args: { q?: string; limit: number; offset: number }): Promise<{ items: PublicUser[]; total: number }> {
  const limit = Math.min(Math.max(args.limit, 1), 100);
  const where = args.q?.trim()
    ? or(
        ilike(authUsers.authEmail, `%${args.q.trim()}%`),
        ilike(authUsers.authPhone, `%${args.q.trim()}%`),
        ilike(authUsers.authName, `%${args.q.trim()}%`),
      )
    : undefined;
  const rows = await db.select().from(authUsers).where(where).orderBy(authUsers.authCreatedAt).limit(limit).offset(Math.max(args.offset, 0));
  const [t] = await db.select({ n: count() }).from(authUsers).where(where);
  return { items: rows.map(publicUser), total: Number(t?.n ?? 0) };
}
// ─── @octiq-extend ─── your code below this line ───
