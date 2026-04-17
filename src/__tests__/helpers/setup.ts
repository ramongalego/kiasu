process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.STRIPE_SECRET_KEY ??= 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_test_placeholder';
process.env.STRIPE_PRICE_MONTHLY ??= 'price_test_monthly';
process.env.STRIPE_PRICE_YEARLY ??= 'price_test_yearly';
process.env.STRIPE_PRICE_LIFETIME ??= 'price_test_lifetime';
