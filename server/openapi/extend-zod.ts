/**
 * Single source of truth for activating `.openapi(...)` on every Zod schema
 * in the app. Importing this file once for its side effect is enough; the
 * library is idempotent and guards against double-extension internally.
 *
 * Why a dedicated module? Both `server/db/contract.ts` and
 * `server/openapi/registry.ts` historically called `extendZodWithOpenApi(z)`
 * at their top level, which only worked because their import graph guaranteed
 * one of them ran before any `.openapi(...)` call. A future refactor that
 * imported `z` directly from a new file — and used `.openapi(...)` on a
 * schema declared there — could fail at runtime with a confusing
 * "z.foo().openapi is not a function". Importing this module as the FIRST
 * line of any new entry point (server bootstrap, CLI scripts, test setup)
 * makes the dependency explicit and order-independent.
 *
 * IMPORTANT: keep the import side-effectful. Do NOT export anything from
 * here that triggers tree-shaking the side effect out of the bundle.
 */
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);
