import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRICE_MONTHLY: z.string().min(1, 'STRIPE_PRICE_MONTHLY is required'),
  STRIPE_PRICE_YEARLY: z.string().min(1, 'STRIPE_PRICE_YEARLY is required'),
  STRIPE_PRICE_LIFETIME: z.string().min(1, 'STRIPE_PRICE_LIFETIME is required'),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid or missing environment variables:\n${formatted}\n` +
        'See .env.example for the full list of required variables.',
    );
  }
  return parsed.data;
}

export const env = loadEnv();

export function appBaseUrl(): string {
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
