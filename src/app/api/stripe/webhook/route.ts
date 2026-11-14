import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma/client';
import { handleSubscriptionDowngrade } from '@/lib/stripe/handle-downgrade';
import { env } from '@/lib/env';
import type Stripe from 'stripe';

const ENDED_STATUSES = new Set<Stripe.Subscription.Status>([
  'canceled',
  'unpaid',
  'incomplete_expired',
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const alreadyProcessed = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
      select: { id: true },
    });
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Delayed payment methods complete checkout before the money settles;
        // those grant access on async_payment_succeeded instead.
        if (session.payment_status === 'unpaid') break;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const isLifetime = session.mode === 'payment';
        const customerId = session.customer as string;
        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: 'premium',
            stripeCustomerId: customerId,
            ...(isLifetime && { lifetimePurchase: true }),
          },
        });

        if (isLifetime) {
          // Stop billing any subscription the buyer had before going lifetime.
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
          });
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDowngrade(subscription.customer as string);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        if (ENDED_STATUSES.has(subscription.status)) {
          await handleSubscriptionDowngrade(customerId);
        } else if (
          subscription.status === 'active' ||
          subscription.status === 'trialing'
        ) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { tier: 'premium' },
          });
        }
        // past_due / incomplete / paused: keep current access while Stripe
        // retries the payment; a final failure arrives as canceled/unpaid.
        break;
      }
    }

    await prisma.webhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
  } catch {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
