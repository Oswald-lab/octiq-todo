// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../use-auth';
import type { Role } from '../roles.generated';

function Loading() {
  return <div className="min-h-screen flex items-center justify-center bg-background text-foreground opacity-70">Loading…</div>;
}

/** Redirects to /login (with ?next=) when signed out. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

/** RequireAuth plus a role check; a signed-in user without the role goes home. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
// ─── @octiq-extend ─── your code below this line ───
