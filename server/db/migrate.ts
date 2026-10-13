import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });
const db = drizzle(pool);
await migrate(db, { migrationsFolder: './server/db/migrations' });

// Reference seeds: seeds/*.sql (top level only — seeds/demo/ is preview-only
// demo content and must never reach a tenant database). Safe to re-run on
// every deploy: seeds are guard-enforced idempotent (ON CONFLICT) pure SQL.
const seedsDir = './server/db/seeds';
if (existsSync(seedsDir)) {
  const seedFiles = readdirSync(seedsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort();
  for (const file of seedFiles) {
    const sql = readFileSync(path.join(seedsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`[migrate] seed applied: ${file}`);
    } catch (err) {
      // A failed reference seed must fail the deploy loudly — a silently
      // half-seeded tenant DB is worse than a failed revision (the previous
      // revision keeps serving).
      console.error(`[migrate] seed FAILED: ${file}`, err);
      await pool.end();
      process.exit(1);
    }
  }
}

await pool.end();
console.log('[migrate] Done');
