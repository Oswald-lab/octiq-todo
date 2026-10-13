import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.errors });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({ error: message });
}
