# Kiasu

A learning-path app: create, share, and discover curated lists of study
resources. Built with Next.js 16, Prisma, Supabase Auth, and Stripe.

## Stack

- **Framework:** Next.js 16 (App Router, server actions, React 19)
- **Database:** PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)
- **Auth:** Supabase Auth (email/password + OAuth)
- **Payments:** Stripe (subscriptions + one-time lifetime)
- **Styling:** Tailwind CSS 4
- **Validation:** Zod
- **Rich text:** Tiptap + `sanitize-html`
- **Testing:** Vitest
- **Analytics:** PostHog, Vercel Analytics

## Architecture

```
src/
├── app/              # Next.js App Router: pages, layouts, server actions, api routes
├── components/       # React components organised by feature
├── lib/              # Shared utilities: env, prisma, supabase, stripe, constants, validations
├── hooks/            # Client-side React hooks
├── providers/        # React context providers (theme, analytics)
├── types/            # Shared TypeScript types
└── __tests__/        # Vitest tests (mocks, helpers, per-feature suites)
```

### Conventions

- **Server actions** live next to the route that uses them (`app/**/actions.ts`).
- **All inputs are Zod-validated** at the server action boundary. See
  `src/lib/validations/schemas.ts`.
- **All user-generated rich text** is sanitized via `sanitizeRichText()`
  before storage.
- **Rate limits** on abuse-prone endpoints use the in-memory limiter in
  `src/lib/rate-limit.ts`. Swap for Redis/Upstash in multi-instance deploys.
- **Environment variables** are validated once, at import time, by
  `src/lib/env.ts`. Downstream code imports the typed `env` object instead of
  reaching for `process.env`.
- **Stripe webhooks** are idempotent. Each event is recorded in
  `WebhookEvent` and re-delivered events are skipped.

## Deployment

The app runs on Vercel, with PostgreSQL and Auth on Supabase, payments via
Stripe, and analytics through PostHog and Vercel Analytics. CI (GitHub
Actions, `.github/workflows/ci.yml`) runs lint, type-check, Prettier, and
tests on every push and pull request.
