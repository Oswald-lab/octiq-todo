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
  })
  .openapi('TodoPublic');

const phonePattern = /^\+?[1-9][0-9]{6,14}$/;

export const todoCreateInputSchema = z
  .object({
    title: z.string().trim().min(1),
    phone: z
      .string()
      .trim()
      .regex(phonePattern, 'Invalid phone number')
      .optional(),
  })
  .openapi('TodoCreateInput');

export const todoUpdateInputSchema = z
  .object({
    title: z.string().trim().min(1),
  })
  .openapi('TodoUpdateInput');

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
