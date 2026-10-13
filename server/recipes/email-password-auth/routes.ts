// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { Router } from 'express';
import { z } from 'zod';
import { emitUserLogin, emitUserRegistered } from './hooks.js';
import { PASSWORD_LOGIN_ENABLED } from './methods.generated.js';
import { requireAuth } from './middleware.js';
import { assertPasswordPolicy, hashPassword, verifyPassword } from './password.js';
import { createLimiter } from './rate-limit.js';
import { initialRoleFor } from './roles.js';
import { issueTokens, verifyRefreshToken } from './session.js';
import {
  bumpTokenVersion, createUser, findUserByEmail, findUserById, publicUser, setPasswordHash, touchLogin, updateProfile,
} from './store.js';

export const authRouter = Router();

const loginLimiter = createLimiter({ windowMs: 15 * 60_000, max: 10 });
const registerLimiter = createLimiter({ windowMs: 60 * 60_000, max: 20 });

const emailSchema = z.string().trim().email().max(254);
const registerSchema = z.object({ email: emailSchema, password: z.string(), name: z.string().trim().max(120).optional() });
const loginSchema = z.object({ email: emailSchema, password: z.string() });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const profileSchema = z.object({ name: z.string().trim().max(120).nullable() });
const changePasswordSchema = z.object({ currentPassword: z.string(), newPassword: z.string() });

function invalid(res: import('express').Response, details: unknown): void {
  res.status(400).json({ error: 'Validation failed', code: 'validation', details });
}

const INVALID_CREDENTIALS = { error: 'Invalid email or password', code: 'invalid_credentials' };

/**
 * Refuses the three password routes when this app has no password login.
 *
 * The pages already hide the form, but hiding is not disabling: an app whose
 * PRD asked only for phone sign-in must not answer `POST /api/auth/register`
 * for anyone who finds it. Returns true when it has already answered.
 */
function passwordDisabled(res: import('express').Response): boolean {
  if (PASSWORD_LOGIN_ENABLED) return false;
  res.status(403).json({
    error: 'This app does not use email and password sign-in',
    code: 'password_login_disabled',
  });
  return true;
}

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  try {
    if (passwordDisabled(res)) return;
    if (!registerLimiter.hit(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Too many attempts, try again later', code: 'rate_limited' });
      return;
    }
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed.error.flatten());
    assertPasswordPolicy(parsed.data.password);
    if (await findUserByEmail(parsed.data.email)) {
      res.status(409).json({ error: 'An account with this email already exists', code: 'email_taken' });
      return;
    }
    const role = await initialRoleFor(parsed.data.email);
    const row = await createUser({ email: parsed.data.email, passwordHash: hashPassword(parsed.data.password), name: parsed.data.name ?? null, role });
    const user = publicUser(row);
    res.status(201).json({ user, ...(await issueTokens(row)) });
    void emitUserRegistered(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    if (passwordDisabled(res)) return;
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed.error.flatten());
    if (!loginLimiter.hit(`${req.ip ?? 'unknown'}:${parsed.data.email.toLowerCase()}`)) {
      res.status(429).json({ error: 'Too many attempts, try again later', code: 'rate_limited' });
      return;
    }
    const row = await findUserByEmail(parsed.data.email);
    if (!row || !verifyPassword(parsed.data.password, row.authPasswordHash)) {
      res.status(401).json(INVALID_CREDENTIALS);
      return;
    }
    if (row.authStatus !== 'active') {
      res.status(403).json({ error: 'Account is disabled', code: 'forbidden' });
      return;
    }
    await touchLogin(row.authId);
    const user = publicUser(row);
    res.json({ user, ...(await issueTokens(row)) });
    void emitUserLogin(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — rotates both tokens
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed.error.flatten());
    const row = await verifyRefreshToken(parsed.data.refreshToken);
    if (!row) {
      res.status(401).json({ error: 'Invalid or expired refresh token', code: 'invalid_token' });
      return;
    }
    res.json({ user: publicUser(row), ...(await issueTokens(row)) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout-all — invalidates every session of the caller
authRouter.post('/logout-all', requireAuth, async (req, res, next) => {
  try {
    await bumpTokenVersion(req.user!.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const row = await findUserById(req.user!.userId);
    if (!row) {
      res.status(401).json({ error: 'Authentication required', code: 'unauthorized' });
      return;
    }
    res.json({ user: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/me
authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed.error.flatten());
    const row = await updateProfile(req.user!.userId, { name: parsed.data.name });
    if (!row) {
      res.status(404).json({ error: 'User not found', code: 'not_found' });
      return;
    }
    res.json({ user: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password — bumps the token version and returns fresh tokens
authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    if (passwordDisabled(res)) return;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed.error.flatten());
    const row = await findUserById(req.user!.userId);
    if (!row || !verifyPassword(parsed.data.currentPassword, row.authPasswordHash)) {
      res.status(401).json({ error: 'Current password is incorrect', code: 'invalid_credentials' });
      return;
    }
    assertPasswordPolicy(parsed.data.newPassword);
    await setPasswordHash(row.authId, hashPassword(parsed.data.newPassword));
    const fresh = (await findUserById(row.authId))!;
    res.json({ user: publicUser(fresh), ...(await issueTokens(fresh)) });
  } catch (err) {
    next(err);
  }
});
// ─── @octiq-extend ─── your code below this line ───
