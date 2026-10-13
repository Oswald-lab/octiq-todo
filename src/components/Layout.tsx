import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { RecipeSlot } from '../recipes';
import { ThemeToggle } from './ThemeToggle';

type LayoutProps = {
  readonly children: ReactNode;
};

/**
 * App shell for pages that live outside the auth recipe's own screens.
 * The header is page chrome: brand at the left gutter, account control at the right.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-30 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Skip to main content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
          >
            Todo
          </Link>
          <div className="flex items-center gap-4">
            <RecipeSlot name="user-menu" />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
