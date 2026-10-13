// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { PublicUser } from './api';

/**
 * Something to call a user by, whichever credential they signed up with.
 *
 * `user.name ?? user.email` is wrong now that both can be null: a phone-only
 * account with no name rendered as the string "null". Use this everywhere a
 * user is labelled.
 */
export function displayName(user: Pick<PublicUser, 'name' | 'email' | 'phone'>): string {
  return user.name ?? user.email ?? user.phone ?? 'Account';
}
// ─── @octiq-extend ─── your code below this line ───
