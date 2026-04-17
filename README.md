# Kiasu

A learning-path app: create, share, and discover curated lists of study
resources.

## Stack

- **Framework:** Next.js (App Router, server actions, React)
- **Database:** PostgreSQL via Prisma
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Testing:** Vitest

## Conventions

- Server actions live next to the routes that use them.
- All inputs are validated at the server-action boundary.
- All user-generated rich text is sanitized before storage.
- Abuse-prone endpoints are rate limited.
- Environment variables are validated once at import time and consumed
  through a typed accessor (no direct `process.env` reads downstream).
- Stripe webhooks are processed idempotently.

## Deployment

The app runs on Vercel, with PostgreSQL and Auth on Supabase, and payments
via Stripe. CI runs lint, type-check, formatting, and tests on every push
and pull request.
