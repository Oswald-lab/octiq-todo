import { Router } from 'express';
import { registry } from '../openapi/registry.js';
import {
  errorResponseSchema,
  healthResponseSchema,
  todoCreateInputSchema,
  todoIdParamsSchema,
  todoListResponseSchema,
  todoPublicSchema,
  todoUpdateInputSchema,
} from '../db/contract.js';
import { todosRouter } from './todos.js';

export const apiRouter = Router();

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['system'],
  summary: 'Liveness probe',
  responses: {
    200: { description: 'Service is up', content: { 'application/json': { schema: healthResponseSchema } } },
  },
});
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

registry.registerPath({
  method: 'get',
  path: '/api/todos',
  tags: ['todos'],
  summary: "List the signed-in user's todos",
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: todoListResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/todos',
  tags: ['todos'],
  summary: 'Create a new todo',
  request: {
    body: {
      content: { 'application/json': { schema: todoCreateInputSchema } },
    },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: todoPublicSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: errorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/todos/{id}',
  tags: ['todos'],
  summary: "Update a todo's title or due date",
  request: {
    params: todoIdParamsSchema,
    body: {
      content: { 'application/json': { schema: todoUpdateInputSchema } },
    },
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: todoPublicSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: errorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Todo not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/todos/{id}',
  tags: ['todos'],
  summary: 'Delete a todo',
  request: {
    params: todoIdParamsSchema,
  },
  responses: {
    204: { description: 'Todo deleted' },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Todo not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

apiRouter.use('/todos', todosRouter);
