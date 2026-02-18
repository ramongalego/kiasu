import {
  mockPrisma,
  mockUnauthenticated,
  mockAuthenticated,
  TEST_USER,
} from '../helpers/mocks';

import { fetchDiscoveryLists } from '@/app/discovery/queries';

/** Returns the first argument of the first findMany call. */
function getFindManyArgs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock type
  return mockPrisma.studyList.findMany.mock.calls[0]![0] as Record<string, any>;
}

function makeList(overrides: Record<string, unknown> = {}) {
  return {
    id: 'list-1',
    title: 'Test List',
    slug: 'test-list',
    description: null,
    category: 'other',
    createdAt: new Date(),
    userId: 'someone-else',
    user: { username: 'testuser', profilePictureUrl: null, avatarUrl: null, tier: 'free' },
    _count: { items: 3, copies: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.studyList.findMany.mockResolvedValue([]);
  mockPrisma.vote.groupBy.mockResolvedValue([]);
  mockUnauthenticated();
});

// ── fetchDiscoveryLists ──────────────────────────────────────

describe('fetchDiscoveryLists', () => {
  // ── Query shape ────────────────────────────────────────────

  it('fetches only public study lists', async () => {
    await fetchDiscoveryLists();

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      }),
    );
  });

  it('excludes users without a username', async () => {
    await fetchDiscoveryLists();

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { username: { not: null } },
        }),
      }),
    );
  });

  it('orders results by createdAt descending', async () => {
    await fetchDiscoveryLists();

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('selects list metadata without individual vote objects', async () => {
    await fetchDiscoveryLists();

    const args = getFindManyArgs();
    expect(args.select).toMatchObject({
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          username: true,
          profilePictureUrl: true,
          avatarUrl: true,
          tier: true,
        },
      },
      _count: { select: { items: true, copies: true } },
    });
    expect(args.select.votes).toBeUndefined();
  });

  it('does not filter by category at the DB level', async () => {
    await fetchDiscoveryLists();

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('returns all lists so the client can filter by category', async () => {
    const lists = [
      makeList({ id: 'prog', category: 'programming' }),
      makeList({ id: 'design', category: 'design' }),
      makeList({ id: 'other', category: 'other' }),
    ];
    mockPrisma.studyList.findMany.mockResolvedValue(lists);

    const result = await fetchDiscoveryLists();

    expect(result.lists).toHaveLength(3);
    expect(result.lists.map((l) => l.category)).toEqual(
      expect.arrayContaining(['programming', 'design', 'other']),
    );
  });

  // ── Vote aggregation ───────────────────────────────────────

  it('uses groupBy for vote counts', async () => {
    mockPrisma.studyList.findMany.mockResolvedValue([makeList()]);
    mockPrisma.vote.groupBy.mockResolvedValue([
      { studyListId: 'list-1', type: 'UP', _count: 5 },
      { studyListId: 'list-1', type: 'DOWN', _count: 2 },
    ]);

    const result = await fetchDiscoveryLists();

    expect(mockPrisma.vote.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['studyListId', 'type'],
        where: { studyListId: { in: ['list-1'] } },
      }),
    );
    expect(result.lists[0]!.upvotes).toBe(5);
    expect(result.lists[0]!.downvotes).toBe(2);
  });

  it('defaults to zero votes when a list has none', async () => {
    mockPrisma.studyList.findMany.mockResolvedValue([makeList()]);
    mockPrisma.vote.groupBy.mockResolvedValue([]);

    const result = await fetchDiscoveryLists();

    expect(result.lists[0]!.upvotes).toBe(0);
    expect(result.lists[0]!.downvotes).toBe(0);
  });

  // ── Returns all lists (no server-side pagination) ──────────

  it('returns all lists without pagination', async () => {
    const lists = Array.from({ length: 25 }, (_, i) =>
      makeList({
        id: `list-${i}`,
        createdAt: new Date(Date.now() - i * 86_400_000),
      }),
    );
    mockPrisma.studyList.findMany.mockResolvedValue(lists);

    const result = await fetchDiscoveryLists();

    expect(result.lists).toHaveLength(25);
  });

  // ── Score sorting ──────────────────────────────────────────

  it('sorts lists by computed score descending', async () => {
    const now = Date.now();
    const lists = [
      makeList({ id: 'low', createdAt: new Date(now - 30 * 86_400_000) }),
      makeList({ id: 'high', createdAt: new Date(now) }),
    ];
    mockPrisma.studyList.findMany.mockResolvedValue(lists);
    mockPrisma.vote.groupBy.mockResolvedValue([
      { studyListId: 'low', type: 'UP', _count: 1 },
      { studyListId: 'high', type: 'UP', _count: 10 },
    ]);

    const result = await fetchDiscoveryLists();

    expect(result.lists[0]!.id).toBe('high');
    expect(result.lists[1]!.id).toBe('low');
  });

  // ── Auth state ─────────────────────────────────────────────

  it('returns isAuthenticated false when not logged in', async () => {
    const result = await fetchDiscoveryLists();

    expect(result.isAuthenticated).toBe(false);
    expect(result.currentUserId).toBeNull();
  });

  it('returns isAuthenticated true and fetches user votes when logged in', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: TEST_USER.id,
      role: 'user',
    });
    mockPrisma.studyList.findMany.mockResolvedValue([makeList()]);
    mockPrisma.vote.findMany.mockResolvedValue([
      { studyListId: 'list-1', type: 'UP' },
    ]);

    const result = await fetchDiscoveryLists();

    expect(result.isAuthenticated).toBe(true);
    expect(result.currentUserId).toBe(TEST_USER.id);
    expect(result.lists[0]!.currentUserVote).toBe('UP');
  });

  it('sets href to dashboard for own lists when authenticated', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: TEST_USER.id,
      role: 'user',
    });
    mockPrisma.studyList.findMany.mockResolvedValue([
      makeList({ userId: TEST_USER.id, slug: 'my-list' }),
    ]);
    mockPrisma.vote.findMany.mockResolvedValue([]);

    const result = await fetchDiscoveryLists();

    expect(result.lists[0]!.href).toBe('/dashboard/my-list');
  });

  it('gives premium users a score boost over equivalent free-tier lists', async () => {
    const now = Date.now();
    const oldDate = new Date(now - 30 * 86_400_000); // 30 days old — no freshness bonus
    const lists = [
      makeList({
        id: 'free-list',
        createdAt: oldDate,
        user: { username: 'freeuser', profilePictureUrl: null, avatarUrl: null, tier: 'free' },
      }),
      makeList({
        id: 'premium-list',
        createdAt: oldDate,
        user: { username: 'premiumuser', profilePictureUrl: null, avatarUrl: null, tier: 'premium' },
      }),
    ];
    mockPrisma.studyList.findMany.mockResolvedValue(lists);
    mockPrisma.vote.groupBy.mockResolvedValue([]);

    const result = await fetchDiscoveryLists();

    expect(result.lists[0]!.id).toBe('premium-list');
    expect(result.lists[1]!.id).toBe('free-list');
  });

  it('sets href to share page for other users lists', async () => {
    mockPrisma.studyList.findMany.mockResolvedValue([
      makeList({ id: 'list-abc', userId: 'other-user' }),
    ]);

    const result = await fetchDiscoveryLists();

    expect(result.lists[0]!.href).toBe('/share/list-abc');
  });
});
