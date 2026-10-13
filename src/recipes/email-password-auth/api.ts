// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { apiFetch } from '../../lib/api';
import type { Role } from './roles.generated';

export interface PublicUser {
  id: string;
  /** `null` for an account created from a phone number alone. */
  email: string | null;
  /** E.164, `null` unless the account was created or linked by phone. */
  phone: string | null;
  name: string | null;
  role: Role;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type AuthResponse = Tokens & { user: PublicUser };

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: { error?: string; code?: string } | null = null;
    try { body = (await res.json()) as { error?: string; code?: string }; } catch { /* non-JSON */ }
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`, body?.code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const authApi = {
  register: (input: { email: string; password: string; name?: string }) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }).then(json<AuthResponse>),
  login: (input: { email: string; password: string }) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }).then(json<AuthResponse>),
  logoutAll: () => apiFetch('/api/auth/logout-all', { method: 'POST' }).then(json<void>),
  me: () => apiFetch('/api/auth/me').then(json<{ user: PublicUser }>),
  updateMe: (patch: { name: string | null }) =>
    apiFetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify(patch) }).then(json<{ user: PublicUser }>),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify(input) }).then(json<AuthResponse>),
};
// ─── @octiq-extend ─── your code below this line ───
