import { prisma } from '@/lib/prisma/client';
import { getAuthUser } from '@/lib/auth';

const MS_PER_DAY = 86_400_000;
const FRESHNESS_WINDOW_DAYS = 14;
const PREMIUM_BOOST = 10;

export type DiscoveryList = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  userId: string;
  user: {
    username: string | null;
    profilePictureUrl: string | null;
    avatarUrl: string | null;
  };
  _count: { items: number };
  upvotes: number;
  downvotes: number;
  currentUserVote: 'UP' | 'DOWN' | null;
  href: string;
  score: number;
};

export async function fetchDiscoveryLists(): Promise<{
  lists: DiscoveryList[];
  isAuthenticated: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
}> {
  // Get auth state
  const { user, isAdmin } = await getAuthUser();
  const userId = user?.id ?? null;

  // Fetch all public lists (lightweight — no vote objects)
  const lists = await prisma.studyList.findMany({
    where: {
      isPublic: true,
      user: { username: { not: null } },
    },
    select: {
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
    },
    orderBy: { createdAt: 'desc' },
  });

  const listIds = lists.map((l) => l.id);

  // Get vote counts via groupBy + user votes in parallel
  const [voteCounts, userVotesRaw] = await Promise.all([
    prisma.vote.groupBy({
      by: ['studyListId', 'type'],
      where: { studyListId: { in: listIds } },
      _count: true,
    }),
    userId
      ? prisma.vote.findMany({
          where: { userId, studyListId: { in: listIds } },
          select: { studyListId: true, type: true },
        })
      : Promise.resolve([]),
  ]);

  // Build vote count map
  const voteMap = new Map<string, { up: number; down: number }>();
  for (const vc of voteCounts) {
    const existing = voteMap.get(vc.studyListId) ?? { up: 0, down: 0 };
    if (vc.type === 'UP') existing.up = vc._count;
    else existing.down = vc._count;
    voteMap.set(vc.studyListId, existing);
  }

  const userVotes = new Map(userVotesRaw.map((v) => [v.studyListId, v.type]));

  // Compute scores and sort
  const now = Date.now();
  const scored = lists
    .map((list) => {
      const counts = voteMap.get(list.id) ?? { up: 0, down: 0 };
      const netVotes = counts.up - counts.down;
      const copyCount = list._count.copies;
      const daysOld = (now - list.createdAt.getTime()) / MS_PER_DAY;
      const freshnessBonus = Math.max(0, FRESHNESS_WINDOW_DAYS - daysOld);
      const premiumBoost = list.user.tier === 'premium' ? PREMIUM_BOOST : 0;
      const score =
        netVotes * 3 + copyCount * 5 + freshnessBonus + premiumBoost;

      return {
        id: list.id,
        title: list.title,
        slug: list.slug,
        description: list.description,
        category: list.category,
        userId: list.userId,
        user: {
          username: list.user.username,
          profilePictureUrl: list.user.profilePictureUrl,
          avatarUrl: list.user.avatarUrl,
        },
        _count: { items: list._count.items },
        upvotes: counts.up,
        downvotes: counts.down,
        currentUserVote: userVotes.get(list.id) ?? null,
        href:
          userId && list.userId === userId
            ? `/dashboard/${list.slug}`
            : `/share/${list.id}`,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    lists: scored,
    isAuthenticated: userId !== null,
    currentUserId: userId,
    isAdmin,
  };
}
