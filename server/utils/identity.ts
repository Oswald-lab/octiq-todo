import type { Request } from 'express';

/**
 * Who is making this request, if any recipe can tell.
 *
 * A slot, not an implementation: the starter ships no auth. When
 * `email-password-auth` is installed, its `register.ts` calls
 * `setIdentityResolver` at module load. Recipes that merely ATTRIBUTE a row to a
 * user (payments) call `resolveIdentity(req)` and get `null` in an app without
 * auth — no dependency between the two recipes. Domain routes that REQUIRE a
 * user import `requireAuth` from the auth recipe directly instead.
 */
export interface Identity {
  userId: string;
  /**
   * `null` for an account that has no address — `phone-otp-auth` creates one
   * from a phone number alone. Anything keyed on email (a payments entitlement)
   * must treat that as "not entitled", never as an empty address.
   */
  email: string | null;
  /** E.164, `null` unless the account was created or linked by phone. */
  phone: string | null;
  role: string;
}

export type IdentityResolver = (req: Request) => Promise<Identity | null>;

let resolver: IdentityResolver = async () => null;

export function setIdentityResolver(fn: IdentityResolver): void {
  resolver = fn;
}

export function resolveIdentity(req: Request): Promise<Identity | null> {
  return resolver(req);
}
