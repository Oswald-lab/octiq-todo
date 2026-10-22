import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Domain tables are appended by the technical-design / backend codegen steps.
// This no-auth starter intentionally has no `users` table.
//
// `timestamps` is exported inline (rather than imported from `./columns.helpers.js`)
// so appended tables that spread `...timestamps` resolve in-file — drizzle-kit's
// schema loader cannot resolve relative `.js` ESM imports, which would otherwise
// produce an empty migrations/ folder and "table does not exist" at runtime.
export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
};

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  ownerId: text('owner_id').notNull(),
  phone: text('phone'),
  dueDate: date('due_date'),
  position: integer('position').default(0).notNull(),
});
