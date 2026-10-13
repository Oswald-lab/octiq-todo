// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { randomBytes, scrypt, scryptSync, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/** scrypt parameters (OWASP-recommended interactive login cost). Stored per hash so they can change later. */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

export function assertPasswordPolicy(pw: string): void {
  if (typeof pw !== 'string' || pw.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters'), { statusCode: 400, code: 'validation' });
  }
  if (pw.length > 128) {
    throw Object.assign(new Error('Password must be at most 128 characters'), { statusCode: 400, code: 'validation' });
  }
}

function encode(salt: Buffer, hash: Buffer): string {
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

interface ParsedHash {
  salt: Buffer;
  expected: Buffer;
  options: ScryptOptions;
}

/** `null` for anything that is not a well-formed `scrypt$…` string — never a throw. */
function parse(stored: string | null): ParsedHash | null {
  if (!stored) return null;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0)) return null;
  const salt = Buffer.from(parts[4]!, 'base64');
  const expected = Buffer.from(parts[5]!, 'base64');
  if (expected.length === 0) return null;
  return { salt, expected, options: { N: n, r, p, maxmem: MAXMEM } };
}

/** `scrypt$N$r$p$<salt b64>$<hash b64>`. */
export function hashPassword(pw: string, salt: Buffer = randomBytes(16)): string {
  return encode(salt, scryptSync(pw, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM }));
}

export function verifyPassword(pw: string, stored: string | null): boolean {
  try {
    const h = parse(stored);
    if (!h) return false;
    return timingSafeEqual(scryptSync(pw, h.salt, h.expected.length, h.options), h.expected);
  } catch {
    return false;
  }
}

function scryptAsync(pw: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(pw, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/**
 * `hashPassword` / `verifyPassword` off the event loop — same format, same
 * parameters, interchangeable with the sync pair. Use these on a hot,
 * unauthenticated path (`phone-otp-auth` hashes a code on every request and
 * verify): a ~50 ms `scryptSync` there stalls every other request in the
 * process, and serialises the concurrent attempts the store must be able to
 * interleave safely.
 */
export async function hashPasswordAsync(pw: string, salt: Buffer = randomBytes(16)): Promise<string> {
  return encode(salt, await scryptAsync(pw, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM }));
}

export async function verifyPasswordAsync(pw: string, stored: string | null): Promise<boolean> {
  try {
    const h = parse(stored);
    if (!h) return false;
    return timingSafeEqual(await scryptAsync(pw, h.salt, h.expected.length, h.options), h.expected);
  } catch {
    return false;
  }
}
// ─── @octiq-extend ─── your code below this line ───
