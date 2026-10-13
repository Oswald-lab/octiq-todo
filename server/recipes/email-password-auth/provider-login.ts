// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { emitUserLogin, emitUserRegistered } from './hooks.js';
import { initialRoleFor } from './roles.js';
import { issueTokens, type Tokens } from './session.js';
import type { AuthUserRow } from '../../db/email-password-auth.schema.js';
import { createUser, findUserByEmail, findUserByPhone, publicUser, setPhone, touchLogin, type PublicUser } from './store.js';

export interface ExternalIdentity {
  email: string;
  name?: string | null;
  /** The provider must have verified the address; linking by email is only safe then. */
  emailVerified: true;
}

/**
 * Sign in through an external identity (Google via the broker). Links to an
 * existing account with the same email, or creates a password-less one.
 * The caller records the provider row (`goog_identities`) with the returned user id.
 */
export async function loginWithExternalIdentity(identity: ExternalIdentity): Promise<{ user: PublicUser; tokens: Tokens; created: boolean }> {
  const existing = await findUserByEmail(identity.email);
  if (existing) {
    if (existing.authStatus !== 'active') {
      throw Object.assign(new Error('Account is disabled'), { statusCode: 403, code: 'forbidden' });
    }
    await touchLogin(existing.authId);
    const user = publicUser(existing);
    void emitUserLogin(user);
    return { user, tokens: await issueTokens(existing), created: false };
  }
  const role = await initialRoleFor(identity.email);
  const row = await createUser({ email: identity.email, passwordHash: null, name: identity.name ?? null, role });
  const user = publicUser(row);
  void emitUserRegistered(user);
  return { user, tokens: await issueTokens(row), created: true };
}

export interface PhoneIdentity {
  /** E.164. Normalise with `phone-otp-auth`'s `normalizePhone` before calling. */
  phone: string;
  name?: string | null;
  /** The caller must have proved control of the number — a delivered OTP. */
  phoneVerified: true;
}

/**
 * Sign in through a verified phone number (`phone-otp-auth`). Links to the
 * account that already holds the number, or creates one with NO email and no
 * password.
 *
 * Deliberately does not link by anything else. A phone number cannot be matched
 * against an email account without asking the person, and guessing would hand
 * one person's account to whoever next holds their recycled number — the reason
 * `loginWithExternalIdentity` links by email only when the provider verified it.
 * Attaching a phone to an existing signed-in account is `setPhone`, from a
 * route that already knows who is calling.
 */
export async function loginWithPhoneIdentity(
  identity: PhoneIdentity,
): Promise<{ user: PublicUser; tokens: Tokens; created: boolean }> {
  const existing = await findUserByPhone(identity.phone);
  if (existing) return signInExisting(existing);
  const role = await initialRoleFor(null);
  let row: AuthUserRow;
  try {
    row = await createUser({ phone: identity.phone, passwordHash: null, name: identity.name ?? null, role });
  } catch (err) {
    // Two first sign-ins for the same number raced past `findUserByPhone` and
    // the other one created the account. `auth_phone` is UNIQUE, so this is the
    // same person arriving twice — sign them into that account, not a 500.
    if (!isUniqueViolation(err)) throw err;
    const winner = await findUserByPhone(identity.phone);
    if (!winner) throw err;
    return signInExisting(winner);
  }
  const user = publicUser(row);
  void emitUserRegistered(user);
  return { user, tokens: await issueTokens(row), created: true };
}

async function signInExisting(row: AuthUserRow): Promise<{ user: PublicUser; tokens: Tokens; created: boolean }> {
  if (row.authStatus !== 'active') {
    throw Object.assign(new Error('Account is disabled'), { statusCode: 403, code: 'forbidden' });
  }
  await touchLogin(row.authId);
  const user = publicUser(row);
  void emitUserLogin(user);
  return { user, tokens: await issueTokens(row), created: false };
}

/**
 * Postgres `23505`. drizzle 0.44 wraps the driver error in `DrizzleQueryError`
 * with the original on `cause`; older drivers throw it bare. PGlite uses the
 * same SQLSTATE, so this holds for the preview runtime too.
 */
function isUniqueViolation(err: unknown): boolean {
  const code = (e: unknown) => (e && typeof e === 'object' ? (e as { code?: unknown }).code : undefined);
  return code(err) === '23505' || code((err as { cause?: unknown } | null)?.cause) === '23505';
}

export { setPhone };
// ─── @octiq-extend ─── your code below this line ───
