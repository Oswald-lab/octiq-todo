// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * The platform identity table. No foreign keys in or out (spec N1): domain tables
 * store `auth_id` in a plain text column and resolve the row through store.ts.
 * Only `drizzle-orm/pg-core` is imported so drizzle-kit can load the compiled
 * file for the preview migrations.
 */
export const authUsers = pgTable('auth_users', {
  authId: uuid('auth_id').primaryKey().defaultRandom(),
  /**
   * NULL for an account created from a phone number alone (`phone-otp-auth`).
   * Still UNIQUE: Postgres allows many NULLs under a unique index, so this
   * stays "one account per address" without forcing every account to have one.
   */
  authEmail: text('auth_email').unique(),
  /**
   * E.164, NULL unless the account was created or linked by phone. UNIQUE for
   * the same reason `auth_email` is — it is a primary credential, not a profile
   * field, which is why it lives here rather than in a `phone-otp-auth` table.
   */
  authPhone: text('auth_phone').unique(),
  /** NULL for accounts created through an external provider (Google, phone OTP). */
  authPasswordHash: text('auth_password_hash'),
  authName: text('auth_name'),
  /** 'user' | 'admin' */
  authRole: text('auth_role').notNull().default('user'),
  /** 'active' | 'disabled' */
  authStatus: text('auth_status').notNull().default('active'),
  /** Bumped on password change / disable / logout-everywhere; every JWT carries it. */
  authTokenVersion: integer('auth_token_version').notNull().default(0),
  authLastLoginAt: timestamp('auth_last_login_at'),
  authCreatedAt: timestamp('auth_created_at').defaultNow().notNull(),
  authUpdatedAt: timestamp('auth_updated_at').defaultNow().notNull(),
});

export type AuthUserRow = typeof authUsers.$inferSelect;
// ─── @octiq-extend ─── your code below this line ───
