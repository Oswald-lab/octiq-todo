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
    frontend: installed
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
      - path: src/recipes/email-password-auth/api.ts
        frozenSha: 695673ae7b234dfc09f859cc7004672c24630e577eadf662dc10996edb26c6c8
      - path: src/recipes/email-password-auth/components/AuthCard.tsx
        frozenSha: cb7f84868b6194d784a757ff2223c2b939585fd199b630c4b8afb21a6bc13737
      - path: src/recipes/email-password-auth/components/Field.tsx
        frozenSha: aa8d29f834b686ad5dc7190750ce37c9af52239c9e1b236fbc0e090e80af6182
      - path: src/recipes/email-password-auth/components/MethodTabs.tsx
        frozenSha: 0b1e37304f16274f23351e82b0985fe482f9468aa839fa912f5be381e2dd369e
      - path: src/recipes/email-password-auth/components/PasswordForm.tsx
        frozenSha: cdf9b009ee7fb47ecc211896ec237e7ec0748bcf2a33d02778b24fb0a71ef5f5
      - path: src/recipes/email-password-auth/components/RequireAuth.tsx
        frozenSha: b5d0963be2f3040048878da13874aec9b4a87d0d49c503601dc9d46750038b63
      - path: src/recipes/email-password-auth/components/UserMenu.tsx
        frozenSha: 9cc148f4b0bbec68fe4db2bec938659d2ce1f3aa22a1f6ed26f58fb7934fb5b9
      - path: src/recipes/email-password-auth/display-name.ts
        frozenSha: 16008c885378540a9a63d491e484ef14279893610602d381fb8807bb969c23a6
      - path: src/recipes/email-password-auth/methods.ts
        frozenSha: b641136b31e6d52e39a5098364166d38c7df638ed4a509d3843a7075bab290a6
      - path: src/recipes/email-password-auth/pages/AccountPage.tsx
        frozenSha: 2c5a7d3806ff6e4ee0a868dc0710c1bacde8abb169ae14a6847ab38dcc7fbd06
      - path: src/recipes/email-password-auth/pages/LoginPage.tsx
        frozenSha: d8824ea8002f31d46d36f955760334ae95b59407e9970d2de44f891003fb6dd3
      - path: src/recipes/email-password-auth/pages/RegisterPage.tsx
        frozenSha: b53a9a9b031b38dbaa9b6eec2a4d6001043aa1cef6b7d51556a6c656191a1aad
      - path: src/recipes/email-password-auth/pages/index.ts
        frozenSha: e72b4baa6a1fab73337b6d7d01abca8d6eaa0063980439df6f8a82db4cf33044
      - path: src/recipes/email-password-auth/register.ts
        frozenSha: c45e5b5f0bd09674888e13cdb1b23e29c1b26a735a30886da38d1a4701f4e592
      - path: src/recipes/email-password-auth/registry.ts
        frozenSha: 249e467dc4c40152befa6b763c11cd38690337ed6042a55ea298157a9c774c18
      - path: src/recipes/email-password-auth/token-store.ts
        frozenSha: b452bd02ba72ef85d1b4ff2614170e5e1856ccd0de7c2b0889b3e742922abaf5
      - path: src/recipes/email-password-auth/use-auth.ts
        frozenSha: 60b4d68b48cce0f9cfd63ace3ecf799e82bdca69a4030478dd9f45660d7e51ca
---

# Installed recipes

Platform recipes installed in this app. Every file these recipes own is
**append-only**: the code above the `@octiq-extend` marker is frozen and the
codegen tools refuse a write that changes it. Add your code below the marker.

## email-password-auth 1.4.0
Tables: `auth_users`. Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout-all`, `GET /api/auth/me`, `PATCH /api/auth/me`, `POST /api/auth/change-password`.
Reserved prefix `auth_` — never author a table or column starting with it.
Roles: `admin`, `user` — a new account starts as `user`; `admin` is the platform admin role. Every role is a value of `auth_users.auth_role`, enforced by `requireRole(...)` and assigned from the admin panel. Never author a role column of your own.
Backend: installed. Frontend: installed.

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
