# LOOP.md

The development loop for Raffu. Every task follows this. No exceptions for "small" changes — small changes are how RLS policies get silently broken.

---

## 1. Understand

Before writing code, answer three questions out loud (in your response):

1. **Which surface?** Server component, client component, server action, route handler, or migration?
2. **Which data?** Which tables does this read or write? What do the RLS policies allow?
3. **Which client?** `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components + actions), or `lib/supabase/middleware.ts` (middleware only)?

If you can't answer these without guessing, **read the relevant existing file first.** Raffu is small — `app/signup/actions.ts` and `app/dashboard/page.tsx` are worked examples of every pattern you'll need.

---

## 2. Plan

For anything larger than a one-line change, write a numbered task list in your response before touching files. Keep it to 3–8 items. Example:

```
1. Add `raffles.is_archived` column via new migration
2. Update RLS `raffles_owner_all` policy to exclude archived by default
3. Add archive button to dashboard/raffles/[id]
4. Add "Archived" filter toggle to dashboard home
5. Typecheck, lint
```

Then execute, in order.

---

## 3. Implement

**Schema changes first.** If the task needs new columns, tables, or policies, write the migration file before any application code. Filename format: `YYYYMMDDHHMMSS_what_changed.sql`. Test locally:

```bash
# In Supabase SQL editor OR via CLI:
supabase db push
```

Then application code, one file at a time. Don't spread changes across ten files simultaneously — it makes the next step fragile.

**Where things go:**

| Need | Goes in |
|---|---|
| Data fetching for a page | Server component (`page.tsx`, no `'use client'`) |
| Form submission | Server action (`actions.ts` with `'use server'` at top) |
| Resend email send | `lib/emails/*.ts` with `import 'server-only'`, called from a server action |
| Reactive UI state | Client component (`'use client'`) — but keep data fetching in the parent server component and pass down |
| OAuth redirect or webhook handler | Route handler (`app/api/.../route.ts` or `app/auth/.../route.ts`) |
| New DB table or column | Migration file in `supabase/migrations/` |

---

## 4. Verify

Run these in order. If any fail, fix before moving on.

```bash
npm run typecheck       # tsc --noEmit — MUST be green
npm run lint            # next lint — MUST be green
npm run dev             # smoke test the page you changed in a browser
```

For DB changes, also verify the RLS policy shape:

1. Log in as user A. Confirm they see their own rows.
2. Log in as user B. Confirm they do NOT see user A's rows.
3. Hit the public surface (e.g. `/r/[slug]`) without a session. Confirm only intended rows are visible.

You don't need to automate this — manual smoke is fine for this stage of the product. But **do it every time.**

---

## 5. Commit

Conventional commits. One concern per commit.

```
feat:  new user-facing capability
fix:   bug fix
db:    migration or RLS change
chore: tooling, deps, non-functional
docs:  README, AGENTS.md, SKILLS.md, LOOP.md, inline comments
```

Bad: `update stuff`
Good: `feat: add raffle archive toggle to dashboard`

---

## 6. Learn (optional but recommended)

If you discovered a project convention not already captured in `AGENTS.md` — add it. If you worked around a gotcha future-you would also hit — document it. These three files (`AGENTS.md`, `SKILLS.md`, `LOOP.md`) are living documents.

Don't bloat them. One sentence, in the right place, beats a paragraph.

---

## Roadmap context — what's in scope for each phase

Knowing the phase helps you decide whether a request is in-scope or out-of-scope.

**v1.0 (shipped):** Landing, signup, login, dashboard shell, Supabase Auth, Resend welcome, trial countdown.

**v1.1 (next):** Port the Lotl raffle runner into authenticated routes.
- `app/dashboard/raffles/new/page.tsx` — setup form, creates a `raffles` row
- `app/dashboard/raffles/[id]/page.tsx` — admin dashboard (QR code, live entries via Supabase Realtime)
- `app/dashboard/raffles/[id]/draw/page.tsx` — slot animation + confetti + applause, writes to `winners`
- `app/r/[slug]/page.tsx` — public entry form, inserts into `entries`

Schema is already migrated — no migration work needed for v1.1.

**v1.2:** Stripe for the £10/mo Pro plan. Add a `subscriptions` table, webhook route at `app/api/stripe/webhook/route.ts`, billing portal link from the dashboard. Trial banner flips to "Upgrade" CTA when `plan === 'trial'` and `trial_ends_at < now`.

If a request doesn't match any phase, flag it: "This looks like v1.3+ work — shall I proceed or scope it out first?"
