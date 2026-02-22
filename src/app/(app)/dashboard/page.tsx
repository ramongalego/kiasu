import type { Metadata } from 'next';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { Container } from '@/components/ui';
import { StudyListGrid } from '@/components/dashboard/study-list-grid';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const { user, isPremium } = await getAuthUser();

  const [lists, completedCounts, dbUser] = await Promise.all([
    prisma.studyList.findMany({
      where: { userId: user!.id },
      include: {
        _count: { select: { items: true } },
        copiedFrom: { select: { user: { select: { username: true } } } },
      },
      orderBy: { position: 'asc' },
    }),
    prisma.studyItem.groupBy({
      by: ['studyListId'],
      where: { studyList: { userId: user!.id }, completed: true },
      _count: true,
    }),
    prisma.user.findUnique({
      where: { id: user!.id },
      select: { pendingDowngradeNotice: true },
    }),
  ]);

  const completedMap = new Map(
    completedCounts.map((c) => [c.studyListId, c._count]),
  );

  const studyLists = lists.map((list) => ({
    ...list,
    _count: {
      ...list._count,
      completedItems: completedMap.get(list.id) ?? 0,
    },
  }));

  const notice = dbUser?.pendingDowngradeNotice;
  const privatizedCount =
    notice != null &&
    typeof notice === 'object' &&
    !Array.isArray(notice) &&
    typeof (notice as Record<string, unknown>).privatizedCount === 'number'
      ? ((notice as Record<string, unknown>).privatizedCount as number)
      : null;

  return (
    <Container as="section" className="py-8">
      <StudyListGrid
        studyLists={studyLists}
        isPremium={isPremium}
        privatizedCount={privatizedCount}
      />
    </Container>
  );
}
