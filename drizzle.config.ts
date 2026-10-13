import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Snippet-contributed tables (e.g. razorpay-payments' payments table) live in their
  // own *.schema.ts files so installs never merge into the LLM-regenerated schema.ts.
  schema: ['./server/db/schema.ts', './server/db/*.schema.ts'],
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/app',
  },
});
