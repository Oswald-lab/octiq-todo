// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { Link, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { MethodTabs } from '../components/MethodTabs';
import { getLoginLinks, getLoginProviders, useRegistryVersion } from '../registry';

/**
 * The page is a shell: it renders whatever sign-in methods and providers are
 * registered, and knows about none of them by name. That is what makes a new
 * auth recipe installable onto an app whose pages have already been rewritten —
 * and what lets an app have phone sign-in and no password form at all.
 */
export function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  useRegistryVersion();

  const providers = getLoginProviders();
  const links = getLoginLinks();

  return (
    <AuthCard title="Log in" subtitle="Welcome back">
      {providers.length > 0 ? (
        <div className="mb-6">
          <div className="flex flex-col gap-2">
            {providers.map(({ id, Component }) => <Component key={id} next={next} />)}
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs opacity-60">
            <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
          </div>
        </div>
      ) : null}
      <MethodTabs next={next} mode="login" />
      <div className="mt-6 flex flex-col gap-1 text-sm">
        {links.map((l) => <Link key={l.id} to={l.to} className="underline-offset-4 hover:underline opacity-80">{l.label}</Link>)}
        <span className="opacity-80">No account? <Link to={`/register?next=${encodeURIComponent(next)}`} className="underline-offset-4 hover:underline">Sign up</Link></span>
      </div>
    </AuthCard>
  );
}
// ─── @octiq-extend ─── your code below this line ───
