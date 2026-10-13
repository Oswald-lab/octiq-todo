import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Self-contained light/dark mode toggle (platform-provided — do not recreate).
 *
 * Rides the design-system theming contract: the `dark` class on the root <html>
 * drives theme.css's `:root` (light) / `.dark` (dark) token sets, so every
 * semantic token utility (bg-background, text-foreground, bg-card, …) flips
 * automatically. No per-component color changes are needed.
 *
 * - Persistence: localStorage key `theme` ('dark' | 'light'). The stored choice
 *   wins on load; with no stored value we honor the scaffold's stamped default
 *   (the `dark` class baked onto <html> at build time).
 * - No context/provider/hook file required — drop <ThemeToggle /> in the header.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
    } catch {
      /* ignore storage failures (e.g. private mode) */
    }
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;
    // Both classes are maintained, not just `dark`. index.html ships class="light",
    // so toggling only `dark` would leave class="light dark" behind — harmless to
    // the CSS (.light is not a selector) but it contradicts the single-mode-class
    // invariant the platform stamp relies on.
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignore storage failures (e.g. private mode) */
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((v) => !v)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
