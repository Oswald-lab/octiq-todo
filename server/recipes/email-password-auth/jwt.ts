// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface JwtClaims {
  sub: string;
  /** `null` for a phone-only account. Informational: every check re-reads the row. */
  email: string | null;
  role: string;
  /** auth_users.auth_token_version at issue time. */
  tv: number;
  typ: 'access' | 'refresh';
  iat: number;
  exp: number;
}

const HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8').toString('base64url');

function sign(data: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(data).digest();
}

export function signJwt(claims: Omit<JwtClaims, 'iat' | 'exp'>, secret: string, ttlSeconds: number, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  const payload = Buffer.from(JSON.stringify({ ...claims, iat, exp: iat + ttlSeconds }), 'utf8').toString('base64url');
  const signature = sign(`${HEADER}.${payload}`, secret).toString('base64url');
  return `${HEADER}.${payload}.${signature}`;
}

export function verifyJwt(token: string, secret: string, nowMs = Date.now()): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts as [string, string, string];
  try {
    const expected = sign(`${h}.${p}`, secret);
    const actual = Buffer.from(s, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') return null;
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as Partial<JwtClaims>;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || typeof claims.tv !== 'number') return null;
    if (claims.typ !== 'access' && claims.typ !== 'refresh') return null;
    if (claims.exp * 1000 <= nowMs) return null;
    return claims as JwtClaims;
  } catch {
    return null;
  }
}

let bootSecret: string | undefined;

/**
 * `AUTH_JWT_SECRET` when set (min 16 chars). Otherwise one random secret per
 * process: the preview database is wiped on every boot anyway, so sessions
 * dying with the process is consistent there. Deployed apps must set it.
 */
export function getSessionSecret(): string {
  const env = process.env['AUTH_JWT_SECRET'];
  if (env && env.length >= 16) return env;
  if (!bootSecret) {
    bootSecret = randomBytes(32).toString('base64url');
    console.warn('[email-password-auth] AUTH_JWT_SECRET is not set — using a per-boot secret. Sessions will not survive a restart. Set AUTH_JWT_SECRET in production.');
  }
  return bootSecret;
}

/**
 * Takes the VALUE, not the key: `process.env[name]` is a dynamic read, and the
 * artifact builder's esbuild `--define` can only substitute a statically written
 * `process.env['LITERAL']`. Reading by variable meant these TTLs silently fell
 * back to their defaults in every preview.
 */
function positiveIntEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function accessTtlSeconds(): number {
  return positiveIntEnv(process.env['AUTH_ACCESS_TTL_SECONDS'], 900);
}

export function refreshTtlSeconds(): number {
  return positiveIntEnv(process.env['AUTH_REFRESH_TTL_SECONDS'], 604_800);
}
// ─── @octiq-extend ─── your code below this line ───
