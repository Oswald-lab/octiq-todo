// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { Link } from 'react-router-dom';
import { displayName } from '../display-name';
import { getUserMenuItems, useRegistryVersion } from '../registry';
import { useAuth } from '../use-auth';

/**
 * Drop into the app header. Uses <details> so it needs no state library and
 * works before hydration. Extra items come from the registry (admin-panel adds
 * "Admin" for admins).
 */
export function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  useRegistryVersion();

  if (isLoading) return <span className="text-sm opacity-60">…</span>;
  if (!user) {
    return (
      <Link to="/login" className="text-sm font-medium underline-offset-4 hover:underline">
        Log in
      </Link>
    );
  }

  const label = displayName(user);
  const initials = label.slice(0, 1).toUpperCase();
  const items = getUserMenuItems().filter((i) => !i.roles || i.roles.includes(user.role));

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted font-semibold">{initials}</span>
        <span className="hidden sm:inline max-w-[12rem] truncate">{label}</span>
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card p-1 shadow-lg z-50">
        <div className="px-3 py-2 text-xs opacity-60 truncate">{user.email ?? user.phone}</div>
        <Link to="/account" className="block rounded px-3 py-2 text-sm hover:bg-muted">Account</Link>
        {items.map((i) => (
          <Link key={i.id} to={i.to} className="block rounded px-3 py-2 text-sm hover:bg-muted">{i.label}</Link>
        ))}
        <button type="button" onClick={logout} className="w-full text-left rounded px-3 py-2 text-sm hover:bg-muted">
          Log out
        </button>
      </div>
    </details>
  );
}
// ─── @octiq-extend ─── your code below this line ───
