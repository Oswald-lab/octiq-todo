// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { registerAuthHooks } from '../../lib/api';
// Side effect only: registers the email + password tab, when this app has one.
// Auth's register module is imported before any other recipe's, so `password`
// is the first method in the strip.
import './methods';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './token-store';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Single-flight refresh: many concurrent 401s share one refresh request.
let refreshing: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  if (refreshing) return refreshing;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return Promise.resolve(null);
  }
  refreshing = fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(tokens);
      return tokens.accessToken;
    })
    .catch(() => {
      clearTokens();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Import-time side effect: App.tsx imports this module at @octiq-recipe-imports.
registerAuthHooks({ getToken: getAccessToken, onUnauthorized: refreshOnce });
// ─── @octiq-extend ─── your code below this line ───
