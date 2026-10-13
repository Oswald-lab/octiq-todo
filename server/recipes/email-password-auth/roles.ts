// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { DEFAULT_ROLE } from './roles.generated.js';
import { countUsers, normalizeEmail, type Role } from './store.js';

/**
 * Who starts as admin: anyone in AUTH_ADMIN_EMAILS (comma-separated), and the
 * very first account unless AUTH_FIRST_USER_ADMIN=false. Everyone else starts as
 * DEFAULT_ROLE — the design's `defaultRole`, `user` when it declared none.
 * Role changes after that go through the admin-panel recipe.
 */
export async function initialRoleFor(email: string | null): Promise<Role> {
  const allow = (process.env['AUTH_ADMIN_EMAILS'] ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  // A phone-only account has no address to match, so it falls through to the
  // first-user rule below rather than being excluded from admin entirely.
  if (email && allow.includes(normalizeEmail(email))) return 'admin';
  if (process.env['AUTH_FIRST_USER_ADMIN'] !== 'false' && (await countUsers()) === 0) return 'admin';
  return DEFAULT_ROLE;
}
// ─── @octiq-extend ─── your code below this line ───
