// Side-effect import: activates `.openapi(...)` on Zod globally BEFORE any
// module that uses it loads. Keep this as the very first import in this file
// and in any other entry point (CLI scripts, tests). See extend-zod.ts.
import './openapi/extend-zod.js';

import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { applyMigrations, applySeeds } from './db/index.js';
import { apiRouter } from './routes/index.js';
import { featureRouters } from './routes/feature-routers.js';
import { errorHandler } from './middleware/error-handler.js';
import { runBootHooks } from './utils/boot.js';
import { mountDocs } from './openapi/mount.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

// Mount snippet-contributed feature routers (no-op when none installed). Kept here in
// the bootstrap entry — the most stable file — so the mount is not lost when the LLM
// regenerates routes/index.ts.
for (const { basePath, router } of featureRouters) {
  app.use(basePath, router);
}
app.use('/api', apiRouter);

mountDocs(app);

app.use(errorHandler);

// Serve built frontend in production.
const __serverDir = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = [path.resolve(__serverDir, '..'), __serverDir]
  .find(dir => existsSync(path.join(dir, 'index.html')));
if (CLIENT_DIST) {
  const INDEX_HTML = path.join(CLIENT_DIST, 'index.html');
  app.use(express.static(CLIENT_DIST, { index: false }));
  app.use((_req, res) => {
    res.sendFile(INDEX_HTML);
  });
}

async function start() {
  await applyMigrations();
  await applySeeds();
  // Recipe-contributed startup work. No-op unless a recipe registered a hook.
  // Must stay after seeds and before listen: hooks touch the database, and no
  // request may be served before they finish.
  await runBootHooks();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${config.port}`);
  });
}
start().catch(err => { console.error('[server] Startup failed:', err); process.exit(1); });
