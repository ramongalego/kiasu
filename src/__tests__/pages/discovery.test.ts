import {
  mockPrisma,
  mockUnauthenticated,
  mockAuthenticated,
  TEST_USER,
} from '../helpers/mocks';

import { fetchDiscoveryLists } from '@/app/discovery/actions';

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
    user: { username: 'testuser', profilePictureUrl: null, avatarUrl: null },
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
    await fetchDiscoveryLists({});

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      }),
    );
  });

  it('excludes users without a username', async () => {
    await fetchDiscoveryLists({});

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { username: { not: null } },
        }),
      }),
    );
  });

  it('orders results by createdAt descending', async () => {
    await fetchDiscoveryLists({});

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('selects list metadata without individual vote objects', async () => {
    await fetchDiscoveryLists({});

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
        },
      },
      _count: { select: { items: true, copies: true } },
    });
    expect(args.select.votes).toBeUndefined();
  });

  // ── Category filtering ─────────────────────────────────────

  it('does not filter by category when none is provided', async () => {
    await fetchDiscoveryLists({});

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('filters by category when a valid category is provided', async () => {
    await fetchDiscoveryLists({ category: 'programming' });

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'programming' }),
      }),
    );
  });

  it('filters by each valid category value', async () => {
    const categories = [
      'programming',
      'design',
      'business',
      'science',
      'language',
      'music',
      'health',
      'writing',
      'personal',
      'other',
    ];

    for (const cat of categories) {
      vi.clearAllMocks();
      mockPrisma.studyList.findMany.mockResolvedValue([]);
      mockPrisma.vote.groupBy.mockResolvedValue([]);
      mockUnauthenticated();

      await fetchDiscoveryLists({ category: cat });

      expect(getFindManyArgs().where.category).toBe(cat);
    }
  });

  it('ignores an invalid category and shows all lists', async () => {
    await fetchDiscoveryLists({ category: 'not-a-real-category' });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('ignores an empty string category', async () => {
    await fetchDiscoveryLists({ category: '' });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('ignores a category with script injection attempt', async () => {
    await fetchDiscoveryLists({ category: '<script>alert(1)</script>' });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  // ── Vote aggregation ───────────────────────────────────────

  it('uses groupBy for vote counts', async () => {
    mockPrisma.studyList.findMany.mockResolvedValue([makeList()]);
    mockPrisma.vote.groupBy.mockResolvedValue([
      { studyListId: 'list-1', type: 'UP', _count: 5 },
      { studyListId: 'list-1', type: 'DOWN', _count: 2 },
    ]);

    const result = await fetchDiscoveryLists({});

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

    const result = await fetchDiscoveryLists({});

    expect(result.lists[0]!.upvotes).toBe(0);
    expect(result.lists[0]!.downvotes).toBe(0);
  });

  // ── Pagination ─────────────────────────────────────────────

  it('returns at most 12 items per page', async () => {
    const lists = Array.from({ length: 15 }, (_, i) =>
      makeList({
        id: `list-${i}`,
        createdAt: new Date(Date.now() - i * 86_400_000),
      }),
    );
    mockPrisma.studyList.findMany.mockResolvedValue(lists);

    const result = await fetchDiscoveryLists({});

    expect(result.lists).toHaveLength(12);
    expect(result.nextCursor).not.toBeNull();
  });

  it('returns all items when fewer than page size', async () => {
    mockPrisma.studyList.findMany.mockResolvedValue([
      makeList({ id: 'a' }),
      makeList({ id: 'b' }),
    ]);

    const result = await fetchDiscoveryLists({});

    expect(result.lists).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it('returns next page when given a cursor', async () => {
    const lists = Array.from({ length: 15 }, (_, i) =>
      makeList({
        id: `list-${i}`,
        createdAt: new Date(Date.now() - i * 86_400_000),
      }),
    );
    mockPrisma.studyList.findMany.mockResolvedValue(lists);

    const firstPage = await fetchDiscoveryLists({});
    vi.clearAllMocks();
    mockPrisma.studyList.findMany.mockResolvedValue(lists);
    mockPrisma.vote.groupBy.mockResolvedValue([]);
    mockUnauthenticated();

    const secondPage = await fetchDiscoveryLists({
      cursor: firstPage.nextCursor!,
    });

    expect(secondPage.lists).toHaveLength(3);
    expect(secondPage.nextCursor).toBeNull();
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

    const result = await fetchDiscoveryLists({});

    expect(result.lists[0]!.id).toBe('high');
    expect(result.lists[1]!.id).toBe('low');
  });

  // ── Auth state ─────────────────────────────────────────────

  it('returns isAuthenticated false when not logged in', async () => {
    const result = await fetchDiscoveryLists({});

    expect(result.isAuthenticated).toBe(false);
    expect(result.currentUserId).toBeNull();
  });

  it('returns isAuthenticated true and fetches user votes when logged in', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.studyList.findMany.mockResolvedValue([makeList()]);
    mockPrisma.vote.findMany.mockResolvedValue([
      { studyListId: 'list-1', type: 'UP' },
    ]);

    const result = await fetchDiscoveryLists({});

    expect(result.isAuthenticated).toBe(true);
    expect(result.currentUserId).toBe(TEST_USER.id);
    expect(result.lists[0]!.currentUserVote).toBe('UP');
  });

  it('sets href to dashboard for own lists when authenticated', async () => {
    mockAuthenticated(TEST_USER);
    mockPrisma.studyList.findMany.mockResolvedValue([
      makeList({ userId: TEST_USER.id, slug: 'my-list' }),
    ]);
    mockPrisma.vote.findMany.mockResolvedValue([]);

    const result = await fetchDiscoveryLists({});

    expect(result.lists[0]!.href).toBe('/dashboard/my-list');
  });

  it('sets href to share page for other users lists', async () => {
    mockPrisma.studyList.findMany.mockResolvedValue([
      makeList({ id: 'list-abc', userId: 'other-user' }),
    ]);

    const result = await fetchDiscoveryLists({});

    expect(result.lists[0]!.href).toBe('/share/list-abc');
  });
});
