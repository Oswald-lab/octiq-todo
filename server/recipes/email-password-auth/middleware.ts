// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { bearerFrom, verifyAccessToken, type AuthUser } from './session.js';
import type { Role } from './store.js';

declare global {
  namespace Express {
    interface Request {
      /** Shape shared with make-callback.ts's HttpRequest.user. */
      user?: { userId: string; email: string | null; phone: string | null; role: string };
      authUser?: AuthUser;
    }
  }
}

async function authenticate(req: Request): Promise<AuthUser | null> {
  if (req.authUser) return req.authUser;
  const token = bearerFrom(req);
  const user = token ? await verifyAccessToken(token) : null;
  if (user) {
    req.user = { userId: user.userId, email: user.email, phone: user.phone, role: user.role };
    req.authUser = user;
  }
  return user;
}

/** Populates req.user when a valid bearer is present; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await authenticate(req);
    next();
  } catch (err) {
    next(err);
  }
}

/** 401 without a valid, active, current-version bearer token. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await authenticate(req))) {
      res.status(401).json({ error: 'Authentication required', code: 'unauthorized' });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** requireAuth plus a role check (403). Usable alone — it authenticates itself. */
export function requireRole(...roles: Role[]): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = await authenticate(req);
      if (!user) {
        res.status(401).json({ error: 'Authentication required', code: 'unauthorized' });
        return;
      }
      if (!roles.includes(user.role)) {
        res.status(403).json({ error: 'Insufficient role', code: 'forbidden' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
// ─── @octiq-extend ─── your code below this line ───
