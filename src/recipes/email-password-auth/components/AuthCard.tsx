// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { ReactNode } from 'react';

/**
 * `shadow-lg`, not `shadow-sm`: a theme may set `--border` to its own
 * `--background` (a borderless look), and then `border-border` draws nothing and
 * the card has no edge at all against the page. The border stays for themes that
 * do have one; the shadow is what guarantees the card reads as a card on the
 * ones that do not.
 */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm opacity-70">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/** `text-destructive`, not a raw `text-red-600`: the theme owns the error colour. */
export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="mt-3 text-sm text-destructive">{children}</p>;
}

/**
 * The primary action on every auth screen — this recipe's forms, phone-otp's,
 * and forgot-password's all import it, so it is the one lever that themes them
 * together.
 *
 * `bg-primary`, NOT `bg-foreground`. `foreground`/`background` is a monochrome
 * pair, so it rendered a near-black button in apps whose palette is nothing of
 * the sort, and the sign-in screen read as a different product from the app
 * behind it. `primary`/`primary-foreground` is the app's own brand pair, and
 * every theme defines it as a contrast-checked pair.
 */
export const buttonClass =
  'w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring';
// ─── @octiq-extend ─── your code below this line ───
