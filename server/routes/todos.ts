import { Router, type Request } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { todos } from '../db/schema.js';
import {
  todoCreateInputSchema,
  todoIdParamsSchema,
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
    .select({ id: todos.id, title: todos.title })
    .from(todos)
    .where(eq(todos.ownerId, userId));
  res.json({ data: rows });
});

todosRouter.post('/', requireAuth, async (req, res) => {
  const { userId } = requireUser(req);
  const parsed = todoCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', field: parsed.error.issues[0]?.path.join('.') });
    return;
  }
  const [created] = await db
    .insert(todos)
    .values({ title: parsed.data.title, ownerId: userId })
    .returning({ id: todos.id, title: todos.title });
  if (created === undefined) {
    throw Object.assign(new Error('Failed to create todo'), { statusCode: 500 });
  }
  res.status(201).json(created);
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
  const [updated] = await db
    .update(todos)
    .set({ title: parsed.data.title })
    .where(and(eq(todos.id, parsedParams.data.id), eq(todos.ownerId, userId)))
    .returning({ id: todos.id, title: todos.title });
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
