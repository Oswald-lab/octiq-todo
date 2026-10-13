// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthCard, ErrorText, buttonClass } from '../components/AuthCard';
import { Field } from '../components/Field';
import { authApi } from '../api';
import { setTokens } from '../token-store';
import { AUTH_ME_KEY, useAuth } from '../use-auth';
import { PASSWORD_LOGIN_ENABLED } from '../methods.generated';

export function AccountPage() {
  const { user, logoutEverywhere } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null); setMsg(null);
    try {
      const r = await authApi.updateMe({ name: name.trim() || null });
      queryClient.setQueryData(AUTH_ME_KEY, r.user);
      setMsg('Profile saved');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save'); }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setError(null); setMsg(null);
    try {
      const r = await authApi.changePassword({ currentPassword: current, newPassword: next });
      setTokens(r);
      setCurrent(''); setNext('');
      setMsg('Password changed — other sessions were signed out');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not change password'); }
  }

  if (!user) return null;

  return (
    <AuthCard title="Account" subtitle={user.email ?? user.phone ?? undefined}>
      <form onSubmit={saveProfile} noValidate>
        <Field id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className={buttonClass}>Save</button>
      </form>
      {/* Hidden for an account with no password to change — a phone-only sign-up,
          or one created through Google. The route refuses it in both cases. */}
      {PASSWORD_LOGIN_ENABLED && user.email ? (
        <form onSubmit={changePassword} noValidate className="mt-8 border-t border-border pt-6">
          <h2 className="text-lg font-medium mb-3">Change password</h2>
          <Field id="current" label="Current password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Field id="new" label="New password (min 8 characters)" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
          <button type="submit" className={buttonClass}>Change password</button>
        </form>
      ) : null}
      <button type="button" onClick={() => void logoutEverywhere()} className="mt-6 w-full rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
        Log out everywhere
      </button>
      {msg ? <p className="mt-3 text-sm opacity-80">{msg}</p> : null}
      <ErrorText>{error}</ErrorText>
    </AuthCard>
  );
}
// ─── @octiq-extend ─── your code below this line ───
