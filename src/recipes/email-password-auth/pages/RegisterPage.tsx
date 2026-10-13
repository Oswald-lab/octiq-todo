// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { Link, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { MethodTabs } from '../components/MethodTabs';
import { getLoginProviders, useRegistryVersion } from '../registry';

/** The sign-up half of the same shell — same methods, same providers, `mode="register"`. */
export function RegisterPage() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  useRegistryVersion();

  const providers = getLoginProviders();

  return (
    <AuthCard title="Create your account">
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
      <MethodTabs next={next} mode="register" />
      <p className="mt-6 text-sm opacity-80">
        Already have an account? <Link to="/login" className="underline-offset-4 hover:underline">Log in</Link>
      </p>
    </AuthCard>
  );
}
// ─── @octiq-extend ─── your code below this line ───
