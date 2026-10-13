/**
 * Export the OpenAPI 3.0 document for this app: written to `openapi.json`
 * (what orval reads) and emitted to stdout as a single JSON line. The octiq workflow runs this via `npx tsx scripts/export-openapi.ts`
 * after `tsc` succeeds so the spec can be embedded in the workflow output
 * (free-tier preview / `GET /projects/:id/openapi`). It is also handy for
 * local debugging: `npm run openapi:export | jq .` to inspect the spec.
 *
 * Importing the route modules first runs their `registry.registerPath(...)`
 * calls as a side effect, so the registry is populated before
 * `buildOpenApi()` walks it. Note that route files transitively load
 * controllers and data-access modules — including `server/db/index.ts`,
 * which opens a libsql client at import time. To keep this script
 * side-effect-free for the filesystem, default `DATABASE_URL` to `:memory:`
 * unless the caller has already set it. (The runtime app picks its real
 * connection string from the same env var.) The assignment runs before any
 * route module loads thanks to dynamic `await import(...)`.
 *
 * IMPORTANT: stdout is a pipe in the workflow path, and `process.exit()` is
 * synchronous — Node will not flush pending stdout writes before exiting.
 * For large specs (hundreds of routes can produce 500KB+ JSON) this would
 * truncate the output and break `JSON.parse` on the consumer side. We pass
 * a callback to `write()` so we only exit after the drain completes.
 */
// `export {}` marks this file as an ES module so TypeScript (with the project's
// `module: ESNext` setting) allows the top-level `await`s below. Without an
// explicit import or export, tsc 5.x treats top-level await as a script-mode
// error (TS1375). The dynamic imports inside the try block intentionally run
// AFTER the env override above, so we can't promote them to top-level static
// imports — `export {}` is the minimal noop that satisfies the module check.
export {};

process.env['DATABASE_URL'] = process.env['DATABASE_URL'] || ':memory:';

// SDK clients (OpenAI, Anthropic, Stripe, …) validate their key in the constructor
// and THROW when it is unset. This script imports the whole route graph at load time
// to populate the OpenAPI registry, so a client built at module scope would throw and
// crash the export (exit 1 → no spec) — even though we never make an API call here.
// Default the common SDK keys to a harmless placeholder so such constructors don't
// throw. Process-env only; never written to disk; the export performs no network I/O.
const EXPORT_PLACEHOLDER_ENV: Record<string, string> = {
  OPENAI_API_KEY: 'sk-export-noop',
  ANTHROPIC_API_KEY: 'sk-ant-export-noop',
  STRIPE_SECRET_KEY: 'sk_test_export_noop',
  RESEND_API_KEY: 're_export_noop',
};
for (const [k, v] of Object.entries(EXPORT_PLACEHOLDER_ENV)) {
  process.env[k] = process.env[k] || v;
}

// stdout is this script's data channel — it must contain ONLY the OpenAPI JSON.
// Importing the route modules below runs their top-level side effects, and some
// generated modules log to stdout at import time (e.g. a route file that starts a
// background scheduler with `console.log('[scheduler] ...')`). Such a stray write
// would prepend noise to stdout and break the consumer's `JSON.parse`. Redirect
// stdout to stderr while the imports run, then restore the real stdout to emit the
// document — keeping the data channel clean regardless of what an import logs.
const realStdoutWrite = process.stdout.write.bind(process.stdout);
const redirectToStderr = (...args: unknown[]): boolean =>
  (process.stderr.write as (...a: unknown[]) => boolean)(...args);
process.stdout.write = redirectToStderr as typeof process.stdout.write;

try {
  // Activate `.openapi(...)` on Zod BEFORE any schema or route module loads.
  await import('../server/openapi/extend-zod.js');
  await import('../server/routes/index.js');
  const { buildOpenApi } = await import('../server/openapi/registry.js');
  const doc = buildOpenApi();
  const json = JSON.stringify(doc);

  // orval declares `input: './openapi.json'` in orval.config.ts — it reads a
  // FILE and cannot consume stdout. Nothing else wrote that file, so the
  // `contract` suite (`openapi:export && orval:generate`) always died with
  // `ResolverError: … ENOENT: openapi.json`, leaving the app with no generated
  // API client. Redirecting is not available to the suite either:
  // builder-workflow's `/execute` spawns without a shell, so `>` is out.
  //
  // Additive, never a replacement — the stdout emit below is still the data
  // channel the workflow path parses (free-tier preview, GET
  // /projects/:id/openapi). A write failure falls into the catch and exits 1,
  // which is the point: a silently missing spec is the bug being fixed here.
  const { writeFileSync } = await import('node:fs');
  writeFileSync('openapi.json', json);

  process.stdout.write = realStdoutWrite as typeof process.stdout.write;
  process.stdout.write(json, () => process.exit(0));
} catch (err) {
  process.stdout.write = realStdoutWrite as typeof process.stdout.write;
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`openapi-export: failed to build document: ${message}\n`, () => process.exit(1));
}
