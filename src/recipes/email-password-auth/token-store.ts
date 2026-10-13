// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
const ACCESS_KEY = 'auth.access';
const REFRESH_KEY = 'auth.refresh';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

let access: string | null = read(ACCESS_KEY);
let refresh: string | null = read(REFRESH_KEY);
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function getAccessToken(): string | null { return access; }
export function getRefreshToken(): string | null { return refresh; }

export function setTokens(t: { accessToken: string; refreshToken: string }): void {
  access = t.accessToken;
  refresh = t.refreshToken;
  try { localStorage.setItem(ACCESS_KEY, access); localStorage.setItem(REFRESH_KEY, refresh); } catch { /* private mode */ }
  emit();
}

export function clearTokens(): void {
  access = null;
  refresh = null;
  try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); } catch { /* private mode */ }
  emit();
}

/** Fires on set/clear in this tab and on changes made by another tab. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === ACCESS_KEY || e.key === REFRESH_KEY || e.key === null) {
      access = read(ACCESS_KEY);
      refresh = read(REFRESH_KEY);
      emit();
    }
  });
}
// ─── @octiq-extend ─── your code below this line ───
