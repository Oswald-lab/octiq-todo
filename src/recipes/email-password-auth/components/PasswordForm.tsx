// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorText, buttonClass } from './AuthCard';
import { Field } from './Field';
import { useAuth } from '../use-auth';

/**
 * The email + password credential method, for both `/login` and `/register`.
 *
 * Extracted from the two pages so it can be REGISTERED like any other method
 * (see `methods.ts`) rather than being hard-coded into them. That is what lets
 * an app with phone OTP and no password login simply not register it, instead of
 * the pages needing to know which methods exist.
 */
export function PasswordForm({ next = '/', mode = 'login' }: { next?: string; mode?: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register({ email, password, name: name.trim() || undefined });
      else await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'register' ? 'Sign up failed' : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {mode === 'register' ? (
        <Field id="name" label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      ) : null}
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        id="password"
        label={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
        type="password"
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        required
        {...(mode === 'register' ? { minLength: 8 } : {})}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {mode === 'register' ? (
        <Field
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      ) : null}
      <button type="submit" className={buttonClass} disabled={busy}>
        {busy ? (mode === 'register' ? 'Creating…' : 'Logging in…') : mode === 'register' ? 'Sign up' : 'Log in'}
      </button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
// ─── @octiq-extend ─── your code below this line ───
