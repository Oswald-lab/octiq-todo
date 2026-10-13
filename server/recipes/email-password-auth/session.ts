// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { AuthUserRow } from '../../db/email-password-auth.schema.js';
import { accessTtlSeconds, getSessionSecret, refreshTtlSeconds, signJwt, verifyJwt } from './jwt.js';
import { findUserById, type Role } from './store.js';

export interface AuthUser {
  userId: string;
  /** `null` for an account created from a phone number alone. */
  email: string | null;
  /** E.164, `null` unless the account was created or linked by phone. */
  phone: string | null;
  role: Role;
  name: string | null;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

export function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    userId: row.authId,
    email: row.authEmail,
    phone: row.authPhone,
    role: row.authRole as Role,
    name: row.authName,
  };
}

export async function issueTokens(row: AuthUserRow): Promise<Tokens> {
  const secret = getSessionSecret();
  const base = { sub: row.authId, email: row.authEmail, role: row.authRole, tv: row.authTokenVersion };
  // `email` may be null on the claim. Nothing verifies against it — the DB row
  // is re-read on every check (`verifyTyped`) — so it is a convenience, not a fact.
  return {
    accessToken: signJwt({ ...base, typ: 'access' }, secret, accessTtlSeconds()),
    refreshToken: signJwt({ ...base, typ: 'refresh' }, secret, refreshTtlSeconds()),
    expiresIn: accessTtlSeconds(),
  };
}

/** DB-checked: the row must exist, be active, and carry the token's version. */
async function verifyTyped(token: string, typ: 'access' | 'refresh'): Promise<AuthUserRow | null> {
  const claims = verifyJwt(token, getSessionSecret());
  if (!claims || claims.typ !== typ) return null;
  const row = await findUserById(claims.sub);
  if (!row || row.authStatus !== 'active' || row.authTokenVersion !== claims.tv) return null;
  return row;
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  const row = await verifyTyped(token, 'access');
  return row ? toAuthUser(row) : null;
}

export async function verifyRefreshToken(token: string): Promise<AuthUserRow | null> {
  return verifyTyped(token, 'refresh');
}

/** The bearer token from an Express request (or anything with `get(name)`), else null. */
export function bearerFrom(req: { get(name: string): string | undefined }): string | null {
  const header = req.get('authorization');
  if (!header || !/^Bearer\s+/i.test(header)) return null;
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 ? token : null;
}
// ─── @octiq-extend ─── your code below this line ───
