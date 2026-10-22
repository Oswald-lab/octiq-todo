import { Router, type Request } from 'express';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { todos } from '../db/schema.js';
import {
  isValidDueDate,
  todoCreateInputSchema,
  todoIdParamsSchema,
  todoReorderInputSchema,
  todoUpdateInputSchema,
} from '../db/contract.js';
import { requireAuth } from '../recipes/email-password-auth/middleware.js';

export const todosRouter = Router();

/**
 * `requireAuth` guarantees `req.user` at runtime, but its type is still
 * optional — narrow it once here instead of asserting `!` in every handler.
 */
function requireUser(req: Request): { userId: string } {
  const user = req.user;
  if (user === undefined) {
    throw Object.assign(new Error('Authentication required'), { statusCode: 401, code: 'unauthorized' });
  }
  return { userId: user.userId };
}

todosRouter.get('/', requireAuth, async (req, res) => {
  const { userId } = requireUser(req);
  const rows = await db
    .select({
      id: todos.id,
      title: todos.title,
      phone: todos.phone,
      dueDate: todos.dueDate,
      position: todos.position,
    })
    .from(todos)
    .where(eq(todos.ownerId, userId))
    .orderBy(asc(todos.position), asc(todos.id));
  res.json({ data: rows });
});

todosRouter.post('/', requireAuth, async (req, res) => {
  const { userId } = requireUser(req);
  const parsed = todoCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', field: parsed.error.issues[0]?.path.join('.') });
    return;
  }
  if (parsed.data.dueDate !== undefined && !isValidDueDate(parsed.data.dueDate)) {
    res.status(400).json({ error: 'Invalid date', field: 'dueDate' });
    return;
  }
  const [positionRow] = await db
    .select({ next: sql<number>`coalesce(max(${todos.position}), -1) + 1` })
    .from(todos)
    .where(eq(todos.ownerId, userId));
  const position = Number(positionRow?.next ?? 0);
  const [created] = await db
    .insert(todos)
    .values({
      title: parsed.data.title,
      ownerId: userId,
      phone: parsed.data.phone ?? null,
      dueDate: parsed.data.dueDate ?? null,
      position,
    })
    .returning({
      id: todos.id,
      title: todos.title,
      phone: todos.phone,
      dueDate: todos.dueDate,
      position: todos.position,
    });
  if (created === undefined) {
    throw Object.assign(new Error('Failed to create todo'), { statusCode: 500 });
  }
  res.status(201).json(created);
});

todosRouter.patch('/reorder', requireAuth, async (req, res) => {
  const { userId } = requireUser(req);
  const parsed = todoReorderInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', field: parsed.error.issues[0]?.path.join('.') });
    return;
  }
  const ids = parsed.data.ids;
  const owned = await db.select({ id: todos.id }).from(todos).where(eq(todos.ownerId, userId));
  const ownedIds = new Set(owned.map((row) => row.id));
  const requestedIds = new Set(ids);
  if (requestedIds.size !== ids.length || ids.length !== ownedIds.size) {
    res.status(400).json({ error: 'Reorder must include every todo exactly once' });
    return;
  }
  if (ids.some((id) => !ownedIds.has(id))) {
    res.status(400).json({ error: 'Reorder must include every todo exactly once' });
    return;
  }
  await db.transaction(async (tx) => {
    for (const [index, id] of ids.entries()) {
      await tx
        .update(todos)
        .set({ position: index })
        .where(and(eq(todos.id, id), eq(todos.ownerId, userId)));
    }
  });
  res.status(204).end();
});

todosRouter.patch('/:id', requireAuth, async (req, res) => {
  const { userId } = requireUser(req);
  const parsedParams = todoIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: 'Invalid todo id', field: 'id' });
    return;
  }
  const parsed = todoUpdateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', field: parsed.error.issues[0]?.path.join('.') });
    return;
  }
  if (
    parsed.data.dueDate !== undefined &&
    parsed.data.dueDate !== null &&
    !isValidDueDate(parsed.data.dueDate)
  ) {
    res.status(400).json({ error: 'Invalid date', field: 'dueDate' });
    return;
  }
  const changes: { title?: string; dueDate?: string | null } = {};
  if (parsed.data.title !== undefined) {
    changes.title = parsed.data.title;
  }
  if (parsed.data.dueDate !== undefined) {
    changes.dueDate = parsed.data.dueDate;
  }
  if (changes.title === undefined && changes.dueDate === undefined) {
    res.status(400).json({ error: 'At least one field is required' });
    return;
  }
  const [updated] = await db
    .update(todos)
    .set(changes)
    .where(and(eq(todos.id, parsedParams.data.id), eq(todos.ownerId, userId)))
    .returning({
      id: todos.id,
      title: todos.title,
      phone: todos.phone,
      dueDate: todos.dueDate,
      position: todos.position,
    });
  if (updated === undefined) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }
  res.json(updated);
});

todosRouter.delete('/:id', requireAuth, async (req, res) => {
  const { userId } = requireUser(req);
  const parsedParams = todoIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: 'Invalid todo id', field: 'id' });
    return;
  }
  const deleted = await db
    .delete(todos)
    .where(and(eq(todos.id, parsedParams.data.id), eq(todos.ownerId, userId)))
    .returning({ id: todos.id });
  if (deleted.length === 0) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }
  res.status(204).end();
});
