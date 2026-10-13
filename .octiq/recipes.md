---
version: 1
roles:
  values:
    - admin
    - user
  default: user
auth:
  passwordLogin: true
recipes:
  - id: email-password-auth
    version: 1.4.0
    prefix: auth_
    installedAt: 2026-10-13T19:00:38.068Z
    requestedBy: design
    backend: installed
    frontend: pending
    files:
      - path: server/db/email-password-auth.schema.ts
        frozenSha: 9e30a967ea7d6ee4dd95fd40a97c856315206302f0a0716c1d4714a4ee25b55e
      - path: server/recipes/email-password-auth/hooks.ts
        frozenSha: 476013a2632c2b3bc647564afaa468b819a2de23278570f65ee36234ec9cea74
      - path: server/recipes/email-password-auth/jwt.ts
        frozenSha: ac97f442d4a120b26004baf502be89088eafe6d0afa10907c24edae894e03c05
      - path: server/recipes/email-password-auth/middleware.ts
        frozenSha: 77830b86ba2aa484fb74aeb6bf9d60281a278cf6d3b70ce25dfcd9f32ee18afe
      - path: server/recipes/email-password-auth/password.ts
        frozenSha: 25a1a08ea280433fb79518ec9bb45f510db3d442907c0aa97b20effd7c89652a
      - path: server/recipes/email-password-auth/provider-login.ts
        frozenSha: 3a03fd33ce293ccb5c6b44a1e35c7b703af211d9098ebf324944929cfd4a0991
      - path: server/recipes/email-password-auth/rate-limit.ts
        frozenSha: 9376a85c56ebbe1d05545cfbb1b654415abb9a63ce829cf213cec79862f298bd
      - path: server/recipes/email-password-auth/register.ts
        frozenSha: b87711dd776b44999727840d0d4497f63c33a5591cffff8b920f432c50eaf663
      - path: server/recipes/email-password-auth/roles.ts
        frozenSha: 5759fad86d6a9aff3ac0f50beb6a39a3c16e20021299251c4fc44aee9e645599
      - path: server/recipes/email-password-auth/routes.ts
        frozenSha: e08d8fede18623f0e4ec7ee5faa8f9721bd0003f868244c860adccdd1d334c69
      - path: server/recipes/email-password-auth/session.ts
        frozenSha: 8bcadf6be6f6f0468408bc3913b8ca10216142bc35987c031754326db3a139e3
      - path: server/recipes/email-password-auth/store.ts
        frozenSha: aff6e6acc8f2aada099332ba4e4d13ae9b32357c402a09bd11fc86ecc20cf080
---

# Installed recipes

Platform recipes installed in this app. Every file these recipes own is
**append-only**: the code above the `@octiq-extend` marker is frozen and the
codegen tools refuse a write that changes it. Add your code below the marker.

## email-password-auth 1.4.0
Tables: `auth_users`. Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout-all`, `GET /api/auth/me`, `PATCH /api/auth/me`, `POST /api/auth/change-password`.
Reserved prefix `auth_` — never author a table or column starting with it.
Roles: `admin`, `user` — a new account starts as `user`; `admin` is the platform admin role. Every role is a value of `auth_users.auth_role`, enforced by `requireRole(...)` and assigned from the admin panel. Never author a role column of your own.
Backend: installed. Frontend: pending.

### Provides
Accounts with bearer sessions (access 15 min, refresh 7 d), roles (the design's `roles`, always including `admin`; the exact list is the `Roles:` line above — `import { ROLES, DEFAULT_ROLE, type Role } from './roles.generated.js'`), a `requireAuth` middleware, and pages at `/login`, `/register`, `/account`. There is no pre-made account: the first registered user becomes admin unless `AUTH_FIRST_USER_ADMIN=false`, and `AUTH_ADMIN_EMAILS` (comma list) also grants admin.

`auth_users` is the app's ONE identity table whichever way people sign in. **Both `auth_email` and `auth_phone` are nullable and unique**: an email/password account has an address, a `phone-otp-auth` account has a number and no address at all, and an account can have both. So `user.email` is `string | null` everywhere — never render it directly, and never key anything on it without checking. Use `displayName(user)` for a label.

`/login` and `/register` render whatever sign-in methods are registered, as tabs, with social providers above them. This recipe registers its own email + password tab; `phone-otp-auth` registers a Phone tab. When `PASSWORD_LOGIN_ENABLED` is false there is no password form and no password route — see the line above this section in `.octiq/recipes.md` if this app is one of those.

### Frozen exports
Backend — `server/recipes/email-password-auth/`
- `middleware.js`: `requireAuth`, `optionalAuth`, `requireRole(...roles)`. On success `req.user = { userId, email, role }` and `req.authUser = { userId, email, role, name }`.
- `store.js`: `findUserById(id)`, `findUserByEmail(email)`, `findUserByPhone(e164)`, `publicUser(row)`, `displayName(user)`, `listUsers({ q?, limit, offset })`, `setRole(id, role)`, `setStatus(id, 'active'|'disabled')`, `setPasswordHash(id, hash)`, `setPhone(id, e164)`, `countUsers()`. `type PublicUser = { id, email: string | null, phone: string | null, name, role, status, createdAt }`.
- `session.js`: `issueTokens(row)`, `verifyAccessToken(token)`, `bearerFrom(req)`.
- `password.js`: `hashPassword(pw)`, `verifyPassword(pw, stored)`, `assertPasswordPolicy(pw)`, and the async (off-event-loop) twins `hashPasswordAsync(pw)` / `verifyPasswordAsync(pw, stored)` — same format, interchangeable hashes.
- `provider-login.js`: `loginWithExternalIdentity({ email, name?, emailVerified: true })` — find-or-create by email; `loginWithPhoneIdentity({ phone, name?, phoneVerified: true })` — find-or-create by E.164 phone, creating an account with no email and no password. Both return `{ user, tokens, created }`.
- `methods.generated.js`: `PASSWORD_LOGIN_ENABLED` — GENERATED from the ledger, never hand-written.
- `hooks.js`: `onUserRegistered(fn)`, `onUserLogin(fn)` — `fn(user: PublicUser)`.

Frontend — `src/recipes/email-password-auth/`
- `use-auth`: `useAuth()` → `{ user, isLoading, isAuthenticated, login(email, pw), register({ email, password, name? }), logout(), logoutEverywhere(), refetch }`.
- `components/RequireAuth`: `<RequireAuth>…</RequireAuth>` (redirects to `/login?next=`), `<RequireRole roles={['admin']}>…</RequireRole>`.
- `components/UserMenu`: `<UserMenu />` — name, Account, admin/extra items, Log out; shows "Log in" when signed out. Put it in your header.
- `registry`: `registerLoginMethod` (a credential tab — email, phone), `registerLoginProvider` (a hand-off button — Google), `registerLoginLink`, `registerUserMenuItem` — for other recipes.
- `display-name`: `displayName(user)` → the user's name, else email, else phone, else `'Account'`.
- `token-store`: `getAccessToken()`, `setTokens()`, `clearTokens()`.

### Use it like this
Protect a route and scope rows to the caller (plain id column, no foreign key):
```ts
import { requireAuth } from '../recipes/email-password-auth/middleware.js';
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(posts).where(eq(posts.ownerId, req.user!.userId));
    res.json(rows);
  } catch (err) { next(err); }
});
```
Create a profile row when someone registers — append below the marker in `server/recipes/email-password-auth/hooks.ts`:
```ts
onUserRegistered(async (user) => { await db.insert(profiles).values({ userId: user.id, displayName: user.name ?? user.email }); });
```
Frontend:
```tsx
const { user, isAuthenticated } = useAuth();
<Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
```
`apiFetch` and every orval hook already send the bearer token.

### Extend it
Your code goes below `@octiq-extend` in `hooks.ts`, or in your own files. Read users through `store.js`. Show a user's name in a list by looking it up with `findUserById` — never by joining `auth_users`. `onUserRegistered` / `onUserLogin` fire for every sign-in method, so branch on `user.email` being null rather than assuming an address.

### Never
- Never author a `users` table, a password column, a phone column, or any `auth_*` name; never declare a relation/foreign key to `auth_users`.
- Never render `user.email` on its own — it is `null` for a phone-only account and shows as blank. Use `displayName(user)`, or `user.email ?? user.phone`.
- Never build another login/register/account page — link to `/login`, `/register`, `/account`.
- Never edit above `@octiq-extend` in any `server/recipes/email-password-auth/*` or `src/recipes/email-password-auth/*` file; the tools refuse it.
- Never read `localStorage` for tokens yourself — use `useAuth()` / `apiFetch`.
