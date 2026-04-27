# AGENTS.md

Raffu is a Next.js 14 (App Router, TS, Tailwind) raffle product. Supabase Auth + Postgres for identity and data. Resend for transactional email. Deploys to Vercel at raffu.xyz.

This file is your standing orders. Read it, then work.

---

## Commands you will actually run

```bash
npm run dev                 # local dev @ http://localhost:3000
npm run build               # next build — fails without .env.local set
npm run typecheck           # tsc --noEmit — MUST pass before you say "done"
npm run lint                # next lint — MUST pass before you say "done"
```

No test runner is wired yet. Don't invent one without asking.

---

## Where things live

- `app/` — App Router routes. Server Components by default; only add `'use client'` when you need hooks or handlers.
- `app/<route>/actions.ts` — server actions. Mutations go here, not API routes.
- `app/auth/*/route.ts` — auth HTTP endpoints (callback, signout). Different from server actions.
- `lib/supabase/{client,server,middleware}.ts` — three clients for three contexts. Pick the right one.
- `lib/emails/welcome.ts` — Resend templates. Server-only (`import 'server-only'` at top).
- `components/` — presentational only. No data fetching here.
- `supabase/migrations/*.sql` — schema. Timestamped filenames. Never edit an applied migration; add a new one.
- `middleware.ts` — refreshes session every request, gates `/dashboard/*`.

---

## Non-obvious rules (this is why this file exists)

### Supabase

- Use `@supabase/ssr`'s new `cookies.getAll`/`setAll` API. The older `get`/`set`/`remove` API is deprecated and will break session refresh.
- **In middleware, call `supabase.auth.getUser()`, never `getSession()`.** `getSession()` reads the cookie without revalidating and opens you to stale-session bugs. This is a documented Supabase gotcha.
- RLS is enabled on every table. A query that returns nothing is almost always a missing policy, not a missing row. Check `supabase/migrations/20260423000001_init.sql` for the policy shape before writing new queries.
- The `on_auth_user_created` trigger creates the `profiles` row automatically from `auth.users.raw_user_meta_data`. **Do not** duplicate that insert in `signupAction` — it will race or conflict.
- New schema changes = new migration file. Name format: `YYYYMMDDHHMMSS_what_changed.sql`. Run in Supabase SQL editor or via `supabase db push` with the CLI. Never edit an old migration that's been applied.

### Server vs client boundaries

- **Resend API key and service role key must never reach the browser.** Anything that uses them goes in a file with `import 'server-only'` at the top OR in a server action / route handler.
- Client components (`'use client'`) never import from `lib/supabase/server.ts` or `lib/emails/*`. The linter won't catch this; you have to.
- Prefer server actions over API routes for form submissions. API routes exist in this codebase only for auth HTTP endpoints (callback, signout) where a redirect response is needed.

### Fail-soft email

`sendWelcomeEmail` wraps all errors and returns `{ ok, error? }`. **Signup must still succeed if Resend is down.** Don't change this to throw — it's intentional.

### Design system

- Colours: Earthy Editorial palette lives in `tailwind.config.ts` as `shadow`, `sand`, `off-white`, `mist`, `border`. Use those names. Don't add arbitrary hex values in JSX.
- Fonts: loaded in `app/layout.tsx` via `next/font`. Don't add Google Fonts `<link>` tags — they conflict with `next/font` optimization.
- When a raffle is running, the admin's two chosen colours override `--color-primary` and `--color-accent` at runtime via CSS custom properties. That work lives in v1.1 — see `LOOP.md`.

---

## DO NOT

- ❌ Use `localStorage` or `sessionStorage` anywhere. This is a Supabase SSR app — state lives in cookies and the DB.
- ❌ Expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to any file without `'server-only'`.
- ❌ Write custom CSS files. Tailwind + the three tokens in `globals.css` are the whole system.
- ❌ Add a new dependency without checking the existing ones. `lodash`, `axios`, `moment`, `uuid` are all already replaceable with stdlib or existing deps.
- ❌ Disable RLS "temporarily for debugging." Write the missing policy instead.
- ❌ Edit `next-env.d.ts` or `tsconfig.tsbuildinfo` — they're generated.
- ❌ Commit `.env.local`. It's in `.gitignore`; keep it that way.

---

## Definition of done

Before you claim a task is complete:

1. `npm run typecheck` → zero errors
2. `npm run lint` → zero warnings or errors
3. If the change touches a route: it loads in the browser without a console error
4. If the change touches the DB: migration file is present, applied locally, and you verified the new RLS policies don't leak or block legitimate reads
5. The relevant file in this project follows the existing patterns (server vs client, where data fetching lives, which Supabase client is used)
6. Conventional commit message: `feat:`, `fix:`, `chore:`, `db:`, `docs:`

---

## When to stop and ask

- You're about to add a dependency
- You're about to disable RLS, loosen a policy, or widen a grant
- You're about to add env vars
- The user asked for X but X conflicts with something in this file — flag it, don't quietly ignore the file
- You've tried the same fix twice and it hasn't worked — stop, state what you've tried, ask

Everything else: proceed.
