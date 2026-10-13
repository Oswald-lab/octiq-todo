const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Auth seam. This file is OWNED (codegen cannot edit it), so a platform recipe
 * registers its token store here at module-evaluation time instead of patching
 * the fetcher. `getToken` supplies the bearer; `onUnauthorized` may refresh and
 * return a new token, in which case the request is retried exactly once.
 */
export interface AuthHooks {
  getToken(): string | null;
  onUnauthorized(): Promise<string | null>;
}

let authHooks: AuthHooks | null = null;

export function registerAuthHooks(hooks: AuthHooks): void {
  authHooks = hooks;
}

const REFRESH_PATH = '/api/auth/refresh';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  const token = authHooks?.getToken() ?? null;
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && authHooks && token && !path.startsWith(REFRESH_PATH)) {
    const fresh = await authHooks.onUnauthorized();
    if (fresh) {
      headers['Authorization'] = `Bearer ${fresh}`;
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  return res;
}
