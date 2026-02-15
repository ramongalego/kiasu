import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { Container } from '@/components/ui';
import { DiscoveryStudyListCard } from '@/components/discovery/discovery-study-list-card';
import { DiscoveryCategoryFilter } from '@/components/discovery/discovery-category-filter';
import { CATEGORY_VALUES } from '@/lib/categories';
import { Compass } from 'lucide-react';
import type { VoteType } from '@prisma/client';

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const validCategory =
    category &&
    CATEGORY_VALUES.includes(category as (typeof CATEGORY_VALUES)[number])
      ? category
      : undefined;

  const studyLists = await prisma.studyList.findMany({
    where: {
      isPublic: true,
      user: { username: { not: null } },
      ...(validCategory && { category: validCategory }),
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
        select: { username: true, profilePictureUrl: true, avatarUrl: true },
      },
      _count: { select: { items: true, copies: true } },
      votes: { select: { type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Optionally get current user's votes (non-blocking)
  let userVotes = new Map<string, VoteType>();
  let isAuthenticated = false;
  let currentUserId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      currentUserId = user.id;
      const listIds = studyLists.map((l) => l.id);
      const votes = await prisma.vote.findMany({
        where: { userId: user.id, studyListId: { in: listIds } },
        select: { studyListId: true, type: true },
      });
      userVotes = new Map(votes.map((v) => [v.studyListId, v.type]));
    }
  } catch {
    // Not authenticated — userVotes stays empty
  }

  const MS_PER_DAY = 86_400_000;
  const FRESHNESS_WINDOW_DAYS = 14;

  const listsWithVotes = studyLists
    .map((list) => {
      const upvotes = list.votes.filter((v) => v.type === 'UP').length;
      const downvotes = list.votes.filter((v) => v.type === 'DOWN').length;
      const netVotes = upvotes - downvotes;
      const copyCount = list._count.copies;
      const daysOld =
        (new Date().getTime() - list.createdAt.getTime()) / MS_PER_DAY;
      const freshnessBonus = Math.max(0, FRESHNESS_WINDOW_DAYS - daysOld);
      const score = netVotes * 3 + copyCount * 5 + freshnessBonus;
      const isOwner = currentUserId !== null && list.userId === currentUserId;
      return {
        ...list,
        upvotes,
        downvotes,
        currentUserVote: userVotes.get(list.id) ?? null,
        href: isOwner ? `/dashboard/${list.slug}` : `/share/${list.id}`,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <Container as="section" className="py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Compass className="h-7 w-7 text-primary" />
          Discovery
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore public study lists created by the community.
        </p>
      </div>

      <DiscoveryCategoryFilter />

      {listsWithVotes.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listsWithVotes.map((list) => (
            <DiscoveryStudyListCard
              key={list.id}
              list={list}
              isAuthenticated={isAuthenticated}
              isOwner={currentUserId !== null && list.userId === currentUserId}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          No study lists found. Try a different category!
        </p>
      )}
    </Container>
  );
}
