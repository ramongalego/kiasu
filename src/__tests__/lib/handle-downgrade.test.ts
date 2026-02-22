import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockPrisma } from '../helpers/mocks';
import { handleSubscriptionDowngrade } from '@/lib/stripe/handle-downgrade';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.user.update.mockResolvedValue({});
  mockPrisma.studyList.updateMany.mockResolvedValue({ count: 0 });
});

describe('handleSubscriptionDowngrade', () => {
  // ── User not found ──────────────────────────────────────────

  it('does nothing when the stripe customer has no matching user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await handleSubscriptionDowngrade('cus_unknown');

    expect(mockPrisma.studyList.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  // ── No private lists ────────────────────────────────────────

  it('sets tier to free with no notice when user has no private lists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.studyList.findMany.mockResolvedValue([]);

    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { tier: 'free' },
    });
    expect(mockPrisma.studyList.updateMany).not.toHaveBeenCalled();
  });

  it('sets tier to free with no notice when user has exactly 1 private list', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.studyList.findMany.mockResolvedValue([{ id: 'list-a' }]);

    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { tier: 'free' },
    });
    expect(mockPrisma.studyList.updateMany).not.toHaveBeenCalled();
  });

  it('sets tier to free with no notice when user is at the private limit (2)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.studyList.findMany.mockResolvedValue([
      { id: 'list-a' },
      { id: 'list-b' },
    ]);

    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { tier: 'free' },
    });
    expect(mockPrisma.studyList.updateMany).not.toHaveBeenCalled();
  });

  // ── Over the limit ──────────────────────────────────────────

  it('converts 1 list to public and records notice when user has 3 private lists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    // findMany returns newest-first (orderBy updatedAt desc)
    mockPrisma.studyList.findMany.mockResolvedValue([
      { id: 'list-newest' },
      { id: 'list-middle' },
      { id: 'list-oldest' },
    ]);
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });

    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        tier: 'free',
        pendingDowngradeNotice: { privatizedCount: 1 },
      },
    });
    expect(mockPrisma.studyList.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['list-oldest'] }, userId: 'user-1' },
      data: { isPublic: true },
    });
  });

  it('keeps the 2 newest private lists and converts the rest when user has 5', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.studyList.findMany.mockResolvedValue([
      { id: 'list-1' }, // newest — kept private
      { id: 'list-2' }, // kept private
      { id: 'list-3' }, // converted
      { id: 'list-4' }, // converted
      { id: 'list-5' }, // oldest — converted
    ]);
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 3 });

    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        tier: 'free',
        pendingDowngradeNotice: { privatizedCount: 3 },
      },
    });
    expect(mockPrisma.studyList.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['list-3', 'list-4', 'list-5'] },
        userId: 'user-1',
      },
      data: { isPublic: true },
    });
  });

  // ── Private-list query ──────────────────────────────────────

  it("queries only the user's private lists ordered newest-first", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.studyList.findMany.mockResolvedValue([]);

    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isPublic: false },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });
  });

  // ── Idempotency ─────────────────────────────────────────────

  it('is idempotent — second call with ≤2 private lists converts nothing', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.studyList.findMany.mockResolvedValue([
      { id: 'list-a' },
      { id: 'list-b' },
    ]);

    await handleSubscriptionDowngrade('cus_123');
    await handleSubscriptionDowngrade('cus_123');

    expect(mockPrisma.studyList.updateMany).not.toHaveBeenCalled();
    // Both calls still set tier:free (idempotent)
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
  });

  // ── Customer ID lookup ──────────────────────────────────────

  it('looks up the user by stripeCustomerId', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await handleSubscriptionDowngrade('cus_abc');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_abc' },
      select: { id: true },
    });
  });
});
