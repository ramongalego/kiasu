import { prisma } from '@/lib/prisma/client';
import { FREE_TIER_LIMITS } from '@/lib/tier-limits';

export async function handleSubscriptionDowngrade(stripeCustomerId: string) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId },
    select: { id: true },
  });
  if (!user) return;

  // Keep the 2 most recently updated private lists; convert the rest to public
  const privateLists = await prisma.studyList.findMany({
    where: { userId: user.id, isPublic: false },
    select: { id: true },
    orderBy: { updatedAt: 'desc' },
  });

  const listsToConvert = privateLists
    .slice(FREE_TIER_LIMITS.privateStudyLists)
    .map((l) => l.id);
  const privatizedCount = listsToConvert.length;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        tier: 'free',
        ...(privatizedCount > 0 && {
          pendingDowngradeNotice: { privatizedCount },
        }),
      },
    }),
    ...(listsToConvert.length > 0
      ? [
          prisma.studyList.updateMany({
            where: { id: { in: listsToConvert }, userId: user.id },
            data: { isPublic: true },
          }),
        ]
      : []),
  ]);
}
