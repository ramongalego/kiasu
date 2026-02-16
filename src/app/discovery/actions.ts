'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { CATEGORY_VALUES } from '@/lib/categories';

const PAGE_SIZE = 12;
const MS_PER_DAY = 86_400_000;
const FRESHNESS_WINDOW_DAYS = 14;

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

export async function fetchDiscoveryLists(params: {
  cursor?: string;
  category?: string;
}): Promise<{
  lists: DiscoveryList[];
  nextCursor: string | null;
  isAuthenticated: boolean;
  currentUserId: string | null;
}> {
  const { cursor, category } = params;

  const validCategory =
    category &&
    CATEGORY_VALUES.includes(category as (typeof CATEGORY_VALUES)[number])
      ? category
      : undefined;

  // Get auth state
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Not authenticated
  }

  // Fetch all public lists (lightweight — no vote objects)
  const lists = await prisma.studyList.findMany({
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
      const score = netVotes * 3 + copyCount * 5 + freshnessBonus;

      return {
        id: list.id,
        title: list.title,
        slug: list.slug,
        description: list.description,
        category: list.category,
        userId: list.userId,
        user: list.user,
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

  // Paginate
  const cursorIndex = cursor ? scored.findIndex((l) => l.id === cursor) + 1 : 0;
  const page = scored.slice(cursorIndex, cursorIndex + PAGE_SIZE);
  const hasMore = cursorIndex + PAGE_SIZE < scored.length;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return {
    lists: page,
    nextCursor,
    isAuthenticated: userId !== null,
    currentUserId: userId,
  };
}

export async function voteStudyList(studyListId: string, type: 'UP' | 'DOWN') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const existing = await prisma.vote.findUnique({
    where: { userId_studyListId: { userId: user.id, studyListId } },
  });

  if (!existing) {
    await prisma.vote.create({
      data: { type, userId: user.id, studyListId },
    });
  } else if (existing.type === type) {
    await prisma.vote.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.vote.update({
      where: { id: existing.id },
      data: { type },
    });
  }

  revalidatePath('/discovery');
  return { success: true };
}

export async function copyStudyList(studyListId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const source = await prisma.studyList.findFirst({
    where: { id: studyListId, isPublic: true },
    include: { items: { orderBy: { position: 'asc' } } },
  });

  if (!source) {
    return { error: 'Study list not found' };
  }

  if (source.userId === user.id) {
    return { error: 'You cannot copy your own list' };
  }

  const alreadyCopied = await prisma.studyList.findFirst({
    where: { userId: user.id, copiedFromId: source.id },
  });

  if (alreadyCopied) {
    return { error: 'You already saved this list' };
  }

  let slug = generateSlug(source.title);

  const existingSlug = await prisma.studyList.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });

  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const [, newList] = await prisma.$transaction([
    prisma.studyList.updateMany({
      where: { userId: user.id },
      data: { position: { increment: 1 } },
    }),
    prisma.studyList.create({
      data: {
        title: source.title,
        description: source.description,
        slug,
        category: source.category,
        isPublic: false,
        position: 0,
        userId: user.id,
        copiedFromId: source.id,
        items: {
          create: source.items.map((item) => ({
            title: item.title,
            notes: item.notes,
            url: item.url,
            position: item.position,
            completed: false,
          })),
        },
      },
    }),
  ]);

  revalidatePath('/dashboard');
  revalidatePath('/discovery');
  return { success: true, slug: newList.slug };
}
