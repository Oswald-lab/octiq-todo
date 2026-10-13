import { PGlite } from '@electric-sql/pglite';
import { drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/pglite/migrator';
import pg from 'pg';
import path from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import { config } from '../config/index.js';
import * as schema from './schema.js';

const isPostgres = config.databaseUrl.startsWith('postgres');
if (!isPostgres) {
  const dbPath = config.databaseUrl;
  if (!dbPath.startsWith('memory://') && !dbPath.startsWith(':memory:')) {
    rmSync(path.resolve(dbPath), { recursive: true, force: true });
    mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
}
const client = isPostgres
  ? new pg.Pool({ connectionString: config.databaseUrl })
  : new PGlite(config.databaseUrl);

// Typed as the PGlite variant — both drivers expose the same schema-generic
// query-builder API, so this keeps full drizzle type inference for either runtime.
export type DB = ReturnType<typeof pgliteDrizzle<typeof schema>>;

export const db: DB = (isPostgres
  ? pgDrizzle(client as pg.Pool, { schema })
  : pgliteDrizzle(client as PGlite, { schema })) as unknown as DB;

export async function applyMigrations(): Promise<void> {
  if (isPostgres) return;
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'server/db/migrations') });
  console.log('[db] Migrations applied');
}

export async function applySeeds(): Promise<void> {
  if (isPostgres) return;
  const seedsDir = path.resolve(process.cwd(), 'server/db/seeds');
  // Reference seeds (seeds/*.sql) first, then preview-only demo content
  // (seeds/demo/*.sql). The deploy entrypoint (migrate.ts) runs ONLY the
  // reference set — demo rows never reach a tenant database.
  const listSql = (dir: string): string[] =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isFile() && e.name.endsWith('.sql'))
          .map((e) => path.join(dir, e.name))
          .sort()
      : [];
  const files = [...listSql(seedsDir), ...listSql(path.join(seedsDir, 'demo'))];
  let applied = 0;
  for (const filePath of files) {
    const file = path.relative(seedsDir, filePath);
    const sql = readFileSync(filePath, 'utf8');
    if (!sql.trim()) continue;
    try {
      await (client as PGlite).exec(sql);
      applied += 1;
    } catch (err) {
      // A stale or malformed seed must not prevent the app from booting —
      // seeds are best-effort demo/reference data, not schema.
      console.error(
        `[db] Seed ${file} failed (skipped):`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  if (files.length > 0) console.log(`[db] Applied ${applied}/${files.length} seed file(s)`);
}

export async function rawQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<{ fields: Array<{ name: string }>; rows: T[] }> {
  if (isPostgres) {
    const result = await (client as pg.Pool).query<T>(sql, params as any[]);
    return { fields: result.fields as Array<{ name: string }>, rows: result.rows };
  }
  const result = await (client as PGlite).query<T>(sql, params);
  return { fields: result.fields as Array<{ name: string }>, rows: result.rows };
}
