// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { PublicUser } from './store.js';

type UserHandler = (user: PublicUser) => Promise<void> | void;

const registeredHandlers: UserHandler[] = [];
const loginHandlers: UserHandler[] = [];

/** Runs after a successful registration (password or external provider). */
export function onUserRegistered(fn: UserHandler): void {
  registeredHandlers.push(fn);
}

/** Runs after every successful login. */
export function onUserLogin(fn: UserHandler): void {
  loginHandlers.push(fn);
}

async function emit(handlers: UserHandler[], user: PublicUser, name: string): Promise<void> {
  for (const h of handlers) {
    try {
      await h(user);
    } catch (err) {
      console.error(`[email-password-auth] ${name} handler failed:`, err instanceof Error ? err.message : err);
    }
  }
}

export function emitUserRegistered(user: PublicUser): Promise<void> {
  return emit(registeredHandlers, user, 'onUserRegistered');
}

export function emitUserLogin(user: PublicUser): Promise<void> {
  return emit(loginHandlers, user, 'onUserLogin');
}
// ─── @octiq-extend ─── your code below this line ───
// Register your handlers here, e.g.
//   onUserRegistered(async (user) => { await db.insert(profiles).values({ userId: user.id }); });
