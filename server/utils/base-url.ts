import type { HttpRequest } from '../middleware/make-callback.js';
import { config } from '../config/index.js';

/**
 * Public origin the app is actually served from, derived from the inbound request.
 *
 * Use this for absolute links in outbound email (verification, password reset,
 * magic links). NEVER hardcode localhost and NEVER read FRONTEND_URL directly: at
 * preview runtime the bundled server has no .env, so process.env.FRONTEND_URL is
 * undefined and config.frontendUrl falls back to localhost — producing links that
 * point at the wrong host.
 */
export function getBaseUrl(req: HttpRequest): string {
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers['host'] || '')
    .split(',')[0]
    .trim();
  if (host) return `${proto}://${host}`.replace(/\/+$/, '');
  return config.frontendUrl.replace(/\/+$/, ''); // last-resort fallback
}
