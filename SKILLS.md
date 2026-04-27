# SKILLS.md

Skills are reusable playbooks. When a user request matches a trigger below, invoke the skill **before** writing code — it will tell you the current best practice, which may differ from your training data.

---

## Triggers → skill

| If the work involves… | Invoke… | Why |
|---|---|---|
| Any UI work (new page, component, artifact) | `my-brand` | Raffu uses the Earthy Editorial palette. This skill has the exact CSS tokens, font imports, and spacing scale so output stays on-brand without guessing. |
| Creating a new React component, landing section, or dashboard widget | `frontend-design` | Component patterns, layout rules, design tokens for this environment. Pair with `my-brand`. |
| Any question about Supabase, Next.js, Resend, or the Anthropic SDK behaviour | `product-self-knowledge` | These APIs change. Your training data may be stale. Check the skill's doc maps first. |
| User uploads a file and its content isn't already in the context | `file-reading` | Tells you which tool to use for each file type instead of `cat`-ing a binary. |

---

## Raffu-specific conventions the skills must respect

- Design system: **Earthy Editorial** by default (Shadow `#272727`, Sand `#D4AA7D`, Off-White `#F5F0E8`). At runtime, admin-picked colours override `--color-primary` and `--color-accent`. Components must read from CSS custom properties, not hardcode hex.
- Fonts: Playfair Display (display) + Inter (body). Loaded once in `app/layout.tsx` via `next/font`. Never add `<link rel="stylesheet">` to Google Fonts — it fights `next/font`.
- Buttons: use the `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-lg`, `.btn-block` classes in `globals.css`. Don't invent new button styles; extend the existing layer.

---

## If no skill matches

Proceed with AGENTS.md as your guide. Skills are accelerators, not gates.
