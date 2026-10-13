import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { getRouterBasename } from '../lib/router-basename';

/**
 * Platform-provided. Keep it, and keep `<AppErrorBoundary>` around `<App />` in src/main.tsx.
 *
 * Without this, one component that throws while rendering unmounts the whole
 * React root and the user sees a blank page. With it, the user sees a short
 * message, can retry, and navigating to another page recovers on its own.
 */

interface BoundaryProps {
  /** Changing this clears a caught error — the current pathname. */
  resetKey: string;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // React has handled this error, so the browser never sees an uncaught
    // exception. Re-raise it to window so error monitors and preview tests
    // (which listen for uncaught errors) still see the crash.
    if (typeof reportError === 'function') reportError(error);
    console.error('[AppErrorBoundary] render error', info.componentStack);
  }

  componentDidUpdate(prev: BoundaryProps, prevState: BoundaryState): void {
    // Only clear an error that was ALREADY showing. Without the prevState check, a page that throws
    // during the same render that changed the location is cleared at once, re-renders, throws again,
    // and is reported twice.
    if (prevState.error && this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Something went wrong on this page</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Try again, or go back to the home page. Other pages still work.
          </p>
          <details className="mt-4 text-xs text-foreground/60">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{error.message}</pre>
          </details>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={this.retry}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-foreground/5"
            >
              Try again
            </button>
            <a
              href={`${getRouterBasename()}/`}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Go to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

function RoutedBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
}

/**
 * Inside a router, navigating to another page clears a caught error. Outside one it still catches,
 * it just cannot reset on navigation. `useLocation()` throws outside a router, and that throw would
 * sit ABOVE the class boundary — blanking the app it exists to protect.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return useInRouterContext() ? (
    <RoutedBoundary>{children}</RoutedBoundary>
  ) : (
    <Boundary resetKey="">{children}</Boundary>
  );
}
