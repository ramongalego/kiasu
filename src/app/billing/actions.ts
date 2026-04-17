'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import { env, appBaseUrl } from '@/lib/env';
import Stripe from 'stripe';

const PRICES = {
  monthly: env.STRIPE_PRICE_MONTHLY,
  yearly: env.STRIPE_PRICE_YEARLY,
  lifetime: env.STRIPE_PRICE_LIFETIME,
} as const;

type CheckoutMode = 'subscription' | 'payment';

function stripeErrorMessage(err: Stripe.errors.StripeError): string {
  switch (err.type) {
    case 'StripeCardError':
      return err.message ?? 'Your card was declined.';
    case 'StripeRateLimitError':
      return 'Too many requests to the payment service. Please try again in a moment.';
    case 'StripeInvalidRequestError':
      return 'Invalid payment request. Please contact support.';
    case 'StripeAPIError':
      return 'The payment service returned an error. Please try again.';
    case 'StripeConnectionError':
      return 'Could not reach the payment service. Check your connection and try again.';
    case 'StripeAuthenticationError':
      return 'Payment configuration error. Please contact support.';
    default:
      return 'Something went wrong with the payment. Please try again.';
  }
}

async function getAuthedUserOrRedirect(): Promise<{
  id: string;
  email: string;
  stripeCustomerId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { stripeCustomerId: true, email: true },
  });

  return {
    id: user.id,
    email: dbUser.email,
    stripeCustomerId: dbUser.stripeCustomerId,
  };
}

type EnsureCustomerResult =
  | { customerId: string; error?: undefined }
  | { customerId?: undefined; error: string };

async function ensureStripeCustomer(
  userId: string,
  email: string,
  existing: string | null,
): Promise<EnsureCustomerResult> {
  if (existing) return { customerId: existing };

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });
    return { customerId: customer.id };
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      return { error: stripeErrorMessage(err) };
    }
    return { error: 'Failed to set up your account. Please try again.' };
  }
}

async function createCheckout(
  mode: CheckoutMode,
  priceId: string,
): Promise<{ error: string } | void> {
  const user = await getAuthedUserOrRedirect();
  const customer = await ensureStripeCustomer(
    user.id,
    user.email,
    user.stripeCustomerId,
  );
  if (customer.error) return { error: customer.error };

  const baseUrl = appBaseUrl();

  let sessionUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customer.customerId,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/dashboard`,
      metadata: { userId: user.id },
    });
    if (!session.url) {
      return { error: 'Could not create checkout session. Please try again.' };
    }
    sessionUrl = session.url;
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      return { error: stripeErrorMessage(err) };
    }
    return { error: 'Could not create checkout session. Please try again.' };
  }

  redirect(sessionUrl);
}

export async function getSubscriptionInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  const sub = subscriptions.data[0];
  if (!sub) return null;

  const periodEnd = sub.items.data[0]?.current_period_end ?? sub.cancel_at;

  return {
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  };
}

export async function cancelSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) return { error: 'No active subscription' };

  const subscriptions = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  const sub = subscriptions.data[0];
  if (!sub) return { error: 'No active subscription' };

  const updated = await stripe.subscriptions.update(sub.id, {
    cancel_at_period_end: true,
  });

  const periodEnd =
    updated.items.data[0]?.current_period_end ?? updated.cancel_at;

  return {
    cancelAt: periodEnd ? new Date(periodEnd * 1000) : null,
  };
}

export async function getLifetimePurchaseCount() {
  return prisma.user.count({ where: { lifetimePurchase: true } });
}

export async function createLifetimeCheckoutSession() {
  return createCheckout('payment', PRICES.lifetime);
}

export async function createCheckoutSession(billing: 'monthly' | 'yearly') {
  return createCheckout('subscription', PRICES[billing]);
}
