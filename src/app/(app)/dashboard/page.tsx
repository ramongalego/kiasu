import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { Container } from '@/components/ui';
import { StudyListGrid } from '@/components/dashboard/study-list-grid';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [lists, completedCounts] = await Promise.all([
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

  return (
    <Container as="section" className="py-8">
      <StudyListGrid studyLists={studyLists} />
    </Container>
  );
}
