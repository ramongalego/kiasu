import { mockPrisma, mockUnauthenticated } from '../helpers/mocks';

// ── Mock UI / component dependencies so the page can render ──
vi.mock('@/components/ui', () => ({
  Container: () => null,
}));
vi.mock('@/components/discovery/discovery-study-list-card', () => ({
  DiscoveryStudyListCard: () => null,
}));
vi.mock('@/components/discovery/discovery-category-filter', () => ({
  DiscoveryCategoryFilter: () => null,
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return { ...actual };
});

import DiscoveryPage from '@/app/discovery/page';

/** Returns the first argument of the first findMany call. */
function getFindManyArgs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mockPrisma.studyList.findMany.mock.calls[0]![0] as Record<string, any>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.studyList.findMany.mockResolvedValue([]);
  mockUnauthenticated();
});

// ── DiscoveryPage ────────────────────────────────────────────

describe('DiscoveryPage', () => {
  it('fetches only public study lists', async () => {
    await DiscoveryPage({ searchParams: Promise.resolve({}) });

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      }),
    );
  });

  it('excludes users without a username', async () => {
    await DiscoveryPage({ searchParams: Promise.resolve({}) });

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { username: { not: null } },
        }),
      }),
    );
  });

  it('orders results by createdAt descending', async () => {
    await DiscoveryPage({ searchParams: Promise.resolve({}) });

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('includes user info, item count, and votes in the select', async () => {
    await DiscoveryPage({ searchParams: Promise.resolve({}) });

    expect(mockPrisma.studyList.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          userId: true,
          user: {
            select: {
              username: true,
              profilePictureUrl: true,
              avatarUrl: true,
            },
          },
          _count: { select: { items: true } },
          votes: { select: { type: true } },
        }),
      }),
    );
  });

  it('does not filter by category when none is provided', async () => {
    await DiscoveryPage({ searchParams: Promise.resolve({}) });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('filters by category when a valid category is provided', async () => {
    await DiscoveryPage({
      searchParams: Promise.resolve({ category: 'programming' }),
    });

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
      mockUnauthenticated();

      await DiscoveryPage({
        searchParams: Promise.resolve({ category: cat }),
      });

      expect(getFindManyArgs().where.category).toBe(cat);
    }
  });

  it('ignores an invalid category and shows all lists', async () => {
    await DiscoveryPage({
      searchParams: Promise.resolve({ category: 'not-a-real-category' }),
    });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('ignores an empty string category', async () => {
    await DiscoveryPage({
      searchParams: Promise.resolve({ category: '' }),
    });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });

  it('ignores a category with script injection attempt', async () => {
    await DiscoveryPage({
      searchParams: Promise.resolve({ category: '<script>alert(1)</script>' }),
    });

    expect(getFindManyArgs().where.category).toBeUndefined();
  });
});
