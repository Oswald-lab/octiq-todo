import '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

export const healthResponseSchema = z
  .object({
    status: z.literal('ok'),
    timestamp: z.string().openapi({ description: 'ISO-8601 timestamp.' }),
  })
  .openapi('HealthResponse');

export const errorResponseSchema = z
  .object({
    error: z.string(),
    field: z.string().optional(),
  })
  .openapi('ErrorResponse');

export const todoPublicSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    phone: z.string().nullable(),
    dueDate: z.string().nullable(),
    position: z.number().int(),
  })
  .openapi('TodoPublic');

const phonePattern = /^\+?[1-9][0-9]{6,14}$/;

const dueDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const dueDateSchema = z.string().trim().regex(dueDatePattern, 'Invalid date');

export function isValidDueDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export const todoCreateInputSchema = z
  .object({
    title: z.string().trim().min(1),
    phone: z
      .string()
      .trim()
      .regex(phonePattern, 'Invalid phone number')
      .optional(),
    dueDate: dueDateSchema.optional(),
  })
  .openapi('TodoCreateInput');

export const todoUpdateInputSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    dueDate: dueDateSchema.nullable().optional(),
  })
  .openapi('TodoUpdateInput');

export const todoReorderInputSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1),
  })
  .openapi('TodoReorderInput');

export const todoListResponseSchema = z
  .object({
    data: z.array(todoPublicSchema),
  })
  .openapi('TodoListResponse');

export const todoIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .openapi('TodoIdParams');
