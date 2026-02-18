import { vi, describe, it, expect, beforeEach } from 'vitest';
import Stripe from 'stripe';
import {
  mockPrisma,
  mockAuthenticated,
  mockUnauthenticated,
  TEST_USER,
} from '../helpers/mocks';

// ── Stripe mock ──────────────────────────────────────────────

const mockSubscriptionsList = vi.fn();
const mockSubscriptionsUpdate = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    subscriptions: {
      list: (...args: unknown[]) => mockSubscriptionsList(...args),
      update: (...args: unknown[]) => mockSubscriptionsUpdate(...args),
    },
    customers: {
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  },
}));

// ── Next.js redirect mock ────────────────────────────────────
// next/navigation redirect() always throws internally — mirror that here so
// execution stops after redirect() is called, just like in production.

const mockRedirect = vi.fn().mockImplementation(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import {
  getSubscriptionInfo,
  cancelSubscription,
  getLifetimePurchaseCount,
  createLifetimeCheckoutSession,
  createCheckoutSession,
} from '@/app/billing/actions';

// ── Helpers ──────────────────────────────────────────────────

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    cancel_at_period_end: false,
    cancel_at: null,
    items: {
      data: [{ current_period_end: 1800000000 }],
    },
    ...overrides,
  };
}

function makeStripeError<T extends Stripe.errors.StripeError>(
  Ctor: new (raw: { message: string; type: string }) => T,
  message: string,
  type: string,
): T {
  return new Ctor({ message, type });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscriptionsList.mockResolvedValue({ data: [] });
  mockCustomersCreate.mockResolvedValue({ id: 'cus_new' });
  mockCheckoutSessionsCreate.mockResolvedValue({
    url: 'https://checkout.stripe.com/pay/test',
  });
  mockPrisma.user.count.mockResolvedValue(0);
});

// ── getSubscriptionInfo ──────────────────────────────────────

describe('getSubscriptionInfo', () => {
  it('returns null when not authenticated', async () => {
    mockUnauthenticated();
    expect(await getSubscriptionInfo()).toBeNull();
  });

  it('returns null when user has no stripeCustomerId', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({ stripeCustomerId: null });
    expect(await getSubscriptionInfo()).toBeNull();
  });

  it('returns null when no active subscription found', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_123',
    });
    mockSubscriptionsList.mockResolvedValue({ data: [] });
    expect(await getSubscriptionInfo()).toBeNull();
  });

  it('returns subscription info for an active subscription', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_123',
    });
    mockSubscriptionsList.mockResolvedValue({ data: [makeSubscription()] });

    const result = await getSubscriptionInfo();

    expect(result).not.toBeNull();
    expect(result!.cancelAtPeriodEnd).toBe(false);
    expect(result!.cancelAt).toBeNull();
    expect(result!.currentPeriodEnd).toEqual(new Date(1800000000 * 1000));
  });

  it('returns cancelAtPeriodEnd true and end date when subscription is set to cancel', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_123',
    });
    mockSubscriptionsList.mockResolvedValue({
      data: [
        makeSubscription({ cancel_at_period_end: true, cancel_at: 1800000000 }),
      ],
    });

    const result = await getSubscriptionInfo();

    expect(result!.cancelAtPeriodEnd).toBe(true);
    expect(result!.cancelAt).toEqual(new Date(1800000000 * 1000));
  });

  it('queries Stripe with the correct customer and status', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_abc',
    });

    await getSubscriptionInfo();

    expect(mockSubscriptionsList).toHaveBeenCalledWith({
      customer: 'cus_abc',
      status: 'active',
      limit: 1,
    });
  });
});

// ── cancelSubscription ───────────────────────────────────────

describe('cancelSubscription', () => {
  it('returns error when not authenticated', async () => {
    mockUnauthenticated();
    expect(await cancelSubscription()).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when user has no stripeCustomerId', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({ stripeCustomerId: null });
    expect(await cancelSubscription()).toEqual({
      error: 'No active subscription',
    });
  });

  it('returns error when no active subscription found', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_123',
    });
    mockSubscriptionsList.mockResolvedValue({ data: [] });
    expect(await cancelSubscription()).toEqual({
      error: 'No active subscription',
    });
  });

  it('calls stripe.subscriptions.update with cancel_at_period_end: true', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_123',
    });
    mockSubscriptionsList.mockResolvedValue({
      data: [makeSubscription({ id: 'sub_abc' })],
    });
    mockSubscriptionsUpdate.mockResolvedValue(
      makeSubscription({ id: 'sub_abc', cancel_at_period_end: true }),
    );

    await cancelSubscription();

    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_abc', {
      cancel_at_period_end: true,
    });
  });

  it('returns cancelAt date derived from the updated subscription item period end', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_123',
    });
    mockSubscriptionsList.mockResolvedValue({ data: [makeSubscription()] });
    mockSubscriptionsUpdate.mockResolvedValue(
      makeSubscription({ cancel_at_period_end: true }),
    );

    expect(await cancelSubscription()).toEqual({
      cancelAt: new Date(1800000000 * 1000),
    });
  });
});

// ── getLifetimePurchaseCount ─────────────────────────────────

describe('getLifetimePurchaseCount', () => {
  it('returns the count of users with lifetimePurchase', async () => {
    mockPrisma.user.count.mockResolvedValue(47);
    expect(await getLifetimePurchaseCount()).toBe(47);
  });

  it('queries prisma with the lifetimePurchase filter', async () => {
    mockPrisma.user.count.mockResolvedValue(0);
    await getLifetimePurchaseCount();
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { lifetimePurchase: true },
    });
  });
});

// ── createLifetimeCheckoutSession ────────────────────────────

describe('createLifetimeCheckoutSession', () => {
  it('redirects to /login when not authenticated', async () => {
    mockUnauthenticated();
    await expect(createLifetimeCheckoutSession()).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('returns sold-out error when 100 spots are claimed', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.count.mockResolvedValue(100);
    const result = await createLifetimeCheckoutSession();
    expect(result).toEqual({
      error: 'All 100 lifetime spots have been claimed.',
    });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('redirects to the Stripe checkout URL on success', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.count.mockResolvedValue(50);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/lifetime',
    });

    await expect(createLifetimeCheckoutSession()).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      'https://checkout.stripe.com/pay/lifetime',
    );
  });

  it('creates a new Stripe customer when user has no customerId', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: null,
      email: TEST_USER.email,
    });

    await expect(createLifetimeCheckoutSession()).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: TEST_USER.email,
      metadata: { userId: TEST_USER.id },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { stripeCustomerId: 'cus_new' },
    });
  });

  it('returns a Stripe connection error message when session creation fails', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.count.mockResolvedValue(10);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });
    mockCheckoutSessionsCreate.mockRejectedValue(
      makeStripeError(
        Stripe.errors.StripeConnectionError,
        'Network failure',
        'api_connection_error',
      ),
    );

    const result = await createLifetimeCheckoutSession();

    expect(result).toEqual({
      error:
        'Could not reach the payment service. Check your connection and try again.',
    });
  });

  it('returns a generic error message for non-Stripe errors', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.count.mockResolvedValue(10);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });
    mockCheckoutSessionsCreate.mockRejectedValue(new Error('Unexpected'));

    const result = await createLifetimeCheckoutSession();

    expect(result).toEqual({
      error: 'Could not create checkout session. Please try again.',
    });
  });

  it('creates the session in payment mode', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.count.mockResolvedValue(5);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });

    await expect(createLifetimeCheckoutSession()).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'payment' }),
    );
  });
});

// ── createCheckoutSession ────────────────────────────────────

describe('createCheckoutSession', () => {
  it('redirects to /login when not authenticated', async () => {
    mockUnauthenticated();
    await expect(createCheckoutSession('monthly')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to the Stripe checkout URL on success', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/sub',
    });

    await expect(createCheckoutSession('monthly')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      'https://checkout.stripe.com/pay/sub',
    );
  });

  it('creates a new Stripe customer when user has no customerId', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: null,
      email: TEST_USER.email,
    });

    await expect(createCheckoutSession('yearly')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: TEST_USER.email,
      metadata: { userId: TEST_USER.id },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { stripeCustomerId: 'cus_new' },
    });
  });

  it('reuses existing Stripe customer without creating a new one', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });

    await expect(createCheckoutSession('monthly')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it('creates the session in subscription mode', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });

    await expect(createCheckoutSession('monthly')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription' }),
    );
  });

  it('returns a Stripe API error message when session creation fails', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });
    mockCheckoutSessionsCreate.mockRejectedValue(
      makeStripeError(
        Stripe.errors.StripeAPIError,
        'Internal server error',
        'api_error',
      ),
    );

    const result = await createCheckoutSession('monthly');

    expect(result).toEqual({
      error: 'The payment service returned an error. Please try again.',
    });
  });

  it('returns a generic error message for non-Stripe errors', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
      email: TEST_USER.email,
    });
    mockCheckoutSessionsCreate.mockRejectedValue(new Error('Unexpected'));

    const result = await createCheckoutSession('monthly');

    expect(result).toEqual({
      error: 'Could not create checkout session. Please try again.',
    });
  });

  it('returns a Stripe customer creation error message when customer creation fails', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      stripeCustomerId: null,
      email: TEST_USER.email,
    });
    mockCustomersCreate.mockRejectedValue(
      makeStripeError(
        Stripe.errors.StripeRateLimitError,
        'Too many requests',
        'rate_limit_error',
      ),
    );

    const result = await createCheckoutSession('monthly');

    expect(result).toEqual({
      error:
        'Too many requests to the payment service. Please try again in a moment.',
    });
  });
});
