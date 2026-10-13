// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { PASSWORD_LOGIN_ENABLED } from './methods.generated';
import { registerLoginMethod } from './registry';
import { PasswordForm } from './components/PasswordForm';

/**
 * Registers this recipe's OWN credential method, on the same terms as any other
 * recipe's — `phone-otp-auth/register.ts` does the identical thing.
 *
 * Gated on the generated flag rather than on an env var: the check has to hold
 * at build time so a phone-only app does not ship a password form it will never
 * show, and `.env` is not a channel the installer writes.
 */
if (PASSWORD_LOGIN_ENABLED) {
  registerLoginMethod({ id: 'password', label: 'Email', Component: PasswordForm });
}
// ─── @octiq-extend ─── your code below this line ───
