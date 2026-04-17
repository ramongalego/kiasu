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

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values. All variables
   are validated at startup by `src/lib/env.ts` — the app won't boot if any
   required value is missing or malformed.

3. Apply the Prisma schema:

   ```sh
   npx prisma db push
   ```

4. Run the dev server:

   ```sh
   npm run dev
   ```

## Scripts

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the Next.js dev server                        |
| `npm run build`        | Generate the Prisma client and build for production |
| `npm start`            | Start the production server                         |
| `npm run lint`         | Run ESLint                                          |
| `npm test`             | Run the Vitest suite                                |
| `npm run test:watch`   | Watch-mode tests                                    |
| `npm run format`       | Apply Prettier to all files                         |
| `npm run format:check` | Verify formatting                                   |

## Architecture

```
src/
├── app/              # Next.js App Router — pages, layouts, server actions, api routes
├── components/       # React components organised by feature
├── lib/              # Shared utilities — env, prisma, supabase, stripe, constants, validations
├── hooks/            # Client-side React hooks
├── providers/        # React context providers (theme, analytics)
├── types/            # Shared TypeScript types
└── __tests__/        # Vitest tests (mocks, helpers, per-feature suites)
```

### Conventions

- **Server actions** live next to the route that uses them (`app/**/actions.ts`).
- **All inputs are Zod-validated** at the server action boundary — see
  `src/lib/validations/schemas.ts`.
- **All user-generated rich text** is sanitized via `sanitizeRichText()`
  before storage.
- **Rate limits** on abuse-prone endpoints use the in-memory limiter in
  `src/lib/rate-limit.ts`. Swap for Redis/Upstash in multi-instance deploys.
- **Environment variables** are validated once, at import time, by
  `src/lib/env.ts`. Downstream code imports the typed `env` object instead of
  reaching for `process.env`.
- **Stripe webhooks** are idempotent — each event is recorded in
  `WebhookEvent` and re-delivered events are skipped.

## Deployment

The app is Vercel-ready. Ensure every variable from `.env.example` is set in
the Vercel project settings, including `STRIPE_WEBHOOK_SECRET` from the
dashboard endpoint you configure to point at `/api/stripe/webhook`.

## CI

GitHub Actions runs lint, type-check, prettier, and tests on every push and
pull request (`.github/workflows/ci.yml`).
