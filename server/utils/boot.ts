type BootHook = () => Promise<void> | void;

/**
 * One-time startup work, contributed by recipes.
 *
 * A slot, not an implementation — the same shape as `utils/identity.ts`. The
 * starter ships no hooks. A recipe calls `registerBootHook` at module load (its
 * import is composed into the generated `server/routes/feature-routers.ts`, which `server/index.ts`
 * pulls in via `feature-routers.ts`), so registration always happens before
 * `start()` runs. `start()` then awaits `runBootHooks()` after migrations and
 * seeds and before the port opens, which is what lets a hook touch the database.
 */
const hooks: BootHook[] = [];

export function registerBootHook(fn: BootHook): void {
  hooks.push(fn);
}

export async function runBootHooks(): Promise<void> {
  for (const hook of hooks) {
    try {
      await hook();
    } catch (err) {
      // Never fatal. A missing admin account is recoverable; an app that will
      // not boot is not — and this runs before app.listen().
      console.error('[boot] hook failed (skipped):', err instanceof Error ? err.message : err);
    }
  }
}
