// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { useState } from 'react';
import { getLoginMethods, useRegistryVersion } from '../registry';

/**
 * The credential methods, as a segmented tab strip with the active method's
 * form below it.
 *
 * With one method there is NO tab strip — a single tab is chrome that explains
 * nothing, and a phone-only app should look like a phone-only app rather than
 * one with a disabled Email tab. With none, the caller decides what to say.
 */
export function MethodTabs({ next, mode }: { next: string; mode: 'login' | 'register' }) {
  useRegistryVersion();
  const methods = getLoginMethods();
  // Not an id: the registry can gain a method after mount (another recipe's
  // register module), and an index keeps the first one selected either way.
  const [active, setActive] = useState(0);

  if (methods.length === 0) return null;
  const current = methods[Math.min(active, methods.length - 1)]!;

  return (
    <div>
      {methods.length > 1 ? (
        <div role="tablist" aria-label="Sign-in method" className="mb-5 flex gap-1 rounded-lg bg-muted p-1">
          {methods.map((m, i) => {
            const selected = m.id === current.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(i)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  selected ? 'bg-card text-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <current.Component next={next} mode={mode} />
    </div>
  );
}
// ─── @octiq-extend ─── your code below this line ───
