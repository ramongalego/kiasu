import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrisma } from '../helpers/mocks';

const mockConstructEvent = vi.fn();
const mockHandleSubscriptionDowngrade = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

vi.mock('@/lib/stripe/handle-downgrade', () => ({
  handleSubscriptionDowngrade: (...args: unknown[]) =>
    mockHandleSubscriptionDowngrade(...args),
}));

import { POST } from '@/app/api/stripe/webhook/route';

function makeRequest(body: string, sig?: string) {
  return new NextRequest('https://kiasu.co/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: sig ? { 'stripe-signature': sig } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.user.update.mockResolvedValue({});
  mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });
  mockHandleSubscriptionDowngrade.mockResolvedValue(undefined);
});

describe('POST /api/stripe/webhook', () => {
  // ── Signature validation ────────────────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await POST(makeRequest('{}', 'bad-sig'));
    expect(res.status).toBe(400);
  });

  // ── checkout.session.completed ──────────────────────────────

  it('sets tier to premium and stores stripeCustomerId for subscription checkout', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          metadata: { userId: 'user-1' },
          customer: 'cus_123',
        },
      },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { tier: 'premium', stripeCustomerId: 'cus_123' },
    });
  });

  it('sets tier to premium and lifetimePurchase to true for lifetime payment checkout', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment',
          metadata: { userId: 'user-1' },
          customer: 'cus_123',
        },
      },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        tier: 'premium',
        stripeCustomerId: 'cus_123',
        lifetimePurchase: true,
      },
    });
  });

  it('does not update the DB when checkout session has no userId metadata', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: { mode: 'subscription', metadata: {}, customer: 'cus_123' },
      },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  // ── customer.subscription.deleted ──────────────────────────

  it('calls handleSubscriptionDowngrade on customer.subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_123' } },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockHandleSubscriptionDowngrade).toHaveBeenCalledWith('cus_123');
    expect(mockHandleSubscriptionDowngrade).toHaveBeenCalledTimes(1);
  });

  it('does not call updateMany directly on customer.subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_123' } },
    });

    await POST(makeRequest('{}', 'sig'));

    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ──────────────────────────

  it('sets tier to premium when subscription status is active', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { customer: 'cus_123', status: 'active' } },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_123' },
      data: { tier: 'premium' },
    });
    expect(mockHandleSubscriptionDowngrade).not.toHaveBeenCalled();
  });

  it('calls handleSubscriptionDowngrade when subscription status is past_due', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { customer: 'cus_123', status: 'past_due' } },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockHandleSubscriptionDowngrade).toHaveBeenCalledWith('cus_123');
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('calls handleSubscriptionDowngrade when subscription status is canceled', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { customer: 'cus_123', status: 'canceled' } },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockHandleSubscriptionDowngrade).toHaveBeenCalledWith('cus_123');
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  // ── Unknown events ──────────────────────────────────────────

  it('returns 200 and does nothing for unhandled event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });

    const res = await POST(makeRequest('{}', 'sig'));

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    expect(mockHandleSubscriptionDowngrade).not.toHaveBeenCalled();
  });
});
