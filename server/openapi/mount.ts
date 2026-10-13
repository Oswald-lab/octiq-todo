/**
 * API documentation (Swagger UI)
 * -------------------------------
 * Registers two routes on your Express app:
 *   GET /openapi.json — OpenAPI 3.0 document (machine-readable)
 *   GET /docs         — Interactive Swagger UI (human-readable)
 *
 * The UI loads `swagger-ui-dist` from a public CDN so `/docs` works in minimal
 * deployments (including bundles where `node_modules` is not present at
 * runtime). We use Swagger UI's BaseLayout (no top "Explore" bar) for a clean
 * embedded experience.
 *
 * `/openapi.json` lists `servers: []` so tools resolve paths relative to wherever
 * you fetched the spec. The browser page sets the active server from
 * `window.location` so "Try it out" targets this same app, including when the
 * app is served behind a path prefix or reverse proxy.
 *
 * Resilience: `buildOpenApi()` is invoked inside a try/catch and the result is
 * cached at boot. If the Zod registry is internally inconsistent (e.g. a path
 * declares `/{id}` but the corresponding `registerPath` omits `request.params`)
 * `zod-to-openapi` throws — historically that crashed the whole Express app at
 * boot, even though every business route worked fine. We now degrade to a 503
 * on `/openapi.json` and `/docs` while keeping the rest of the app online.
 */

import type { Express, Request, Response } from 'express';
import { buildOpenApi } from './registry.js';

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    #docs-error {
      display: none;
      max-width: 720px;
      margin: 4rem auto;
      padding: 1.25rem 1.5rem;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #991b1b;
      font-family: system-ui, -apple-system, sans-serif;
      border-radius: 8px;
    }
    #docs-error h1 { margin: 0 0 0.5rem; font-size: 1.05rem; }
    #docs-error code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #fee2e2; padding: 0.1rem 0.35rem; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <div id="docs-error">
    <h1>Could not load API documentation</h1>
    <p>Failed to fetch <code>./openapi.json</code> from the running server. The
       app may still be starting up — try refreshing in a moment.</p>
    <p id="docs-error-detail" style="font-size: 0.85em; opacity: 0.85;"></p>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    (function () {
      function showError(detail) {
        var box = document.getElementById('docs-error');
        var d = document.getElementById('docs-error-detail');
        if (box) box.style.display = 'block';
        if (d && detail) d.textContent = detail;
      }
      // Resolve Try-it-out against this deployment: strip trailing /docs from the path
      // so operation paths like /api/... join to the correct origin + base path.
      var origin = window.location.origin;
      var pathname = window.location.pathname.replace(/\\/docs\\/?$/, '');
      var serverUrl = origin + (pathname || '');

      fetch('./openapi.json', { headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
          return res.json();
        })
        .then(function (spec) {
          spec.servers = [{ url: serverUrl, description: 'Live server' }];
          window.ui = SwaggerUIBundle({
            spec: spec,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis],
            plugins: [SwaggerUIBundle.plugins.DownloadUrl],
            layout: 'BaseLayout',
          });
        })
        .catch(function (err) {
          showError(String(err && err.message ? err.message : err));
        });
    })();
  </script>
</body>
</html>`;

export function mountDocs(app: Express): void {
  // Spec is built once at process start from the Zod registry; same payload for
  // every request. A registry bug (missing `request.params` for a `/{id}` path,
  // a typo'd schema import, etc.) makes `generateDocument()` throw — we catch
  // that here so the app still boots and serves its real endpoints. The error
  // is logged once and surfaced via 503 on the docs routes.
  let doc: ReturnType<typeof buildOpenApi> | null = null;
  let buildError: string | null = null;
  try {
    doc = buildOpenApi();
  } catch (err) {
    buildError = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error('[openapi] Failed to build OpenAPI document at boot:', buildError);
  }

  app.get('/openapi.json', (_req: Request, res: Response) => {
    if (!doc) {
      res.status(503).json({
        error: 'OpenAPI specification unavailable',
        detail: buildError,
        hint: 'Check the server logs — most often this means a registerPath() call references an undefined schema, or a path with {param} placeholders is missing a matching request.params block.',
      });
      return;
    }
    res.json(doc);
  });

  app.get('/docs', (_req: Request, res: Response) => {
    // The Swagger UI page already shows a friendly error if `./openapi.json`
    // fails to load — let it render so the user gets the same surface
    // regardless of whether the spec is missing or the build crashed.
    res.type('html').send(SWAGGER_HTML);
  });
}
