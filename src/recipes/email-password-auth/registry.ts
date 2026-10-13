// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { useSyncExternalStore, type ComponentType } from 'react';
import type { Role } from './roles.generated';

/**
 * Other recipes plug into the auth UI here, from their own `register.ts`, at
 * import time — no edit to any page. google-login adds a provider button,
 * forgot-password adds a link under the form, admin-panel adds a menu item.
 */
export interface LoginProvider { id: string; Component: ComponentType<{ next?: string }> }
export interface LoginLink { id: string; label: string; to: string }
export interface UserMenuItem { id: string; label: string; to: string; roles?: Role[] }

/**
 * A CREDENTIAL method — email + password, phone + code — rendered as a tab
 * inside the login and register cards.
 *
 * Deliberately not the same registry as `LoginProvider`. A provider is a single
 * button that hands off somewhere else (Google), so several can sit side by side
 * under an "or" divider; a method owns the body of the form and only one can be
 * on screen at a time. Collapsing the two would either put a whole phone form
 * under the divider or reduce Google to a tab that does not behave like one.
 *
 * `mode` lets one component serve both pages — phone OTP signs in and signs up
 * through the same two steps, and only needs to ask for a name on the second.
 */
export interface LoginMethod {
  id: string;
  /** Tab label. Short: it shares a row with the others. */
  label: string;
  Component: ComponentType<{ next?: string; mode?: 'login' | 'register' }>;
}

const providers: LoginProvider[] = [];
const methods: LoginMethod[] = [];
const links: LoginLink[] = [];
const menuItems: UserMenuItem[] = [];
let version = 0;
const listeners = new Set<() => void>();

function upsert<T extends { id: string }>(list: T[], item: T): void {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = item; else list.push(item);
  version += 1;
  for (const l of listeners) l();
}

export function registerLoginProvider(p: LoginProvider): void { upsert(providers, p); }
export function registerLoginMethod(m: LoginMethod): void { upsert(methods, m); }
export function registerLoginLink(l: LoginLink): void { upsert(links, l); }
export function registerUserMenuItem(i: UserMenuItem): void { upsert(menuItems, i); }

export function getLoginProviders(): readonly LoginProvider[] { return providers; }
export function getLoginMethods(): readonly LoginMethod[] { return methods; }
export function getLoginLinks(): readonly LoginLink[] { return links; }
export function getUserMenuItems(): readonly UserMenuItem[] { return menuItems; }

/** Re-renders the caller when a registration happens after mount. */
export function useRegistryVersion(): number {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => version,
    () => version,
  );
}
// ─── @octiq-extend ─── your code below this line ───
