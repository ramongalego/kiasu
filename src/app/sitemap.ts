import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publicLists, users] = await Promise.all([
    prisma.studyList.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.user.findMany({
      where: { username: { not: null } },
      select: { username: true, updatedAt: true },
    }),
  ]);

  const listEntries: MetadataRoute.Sitemap = publicLists.map((list) => ({
    url: `https://kiasu.co/share/${list.id}`,
    lastModified: list.updatedAt,
  }));

  const userEntries: MetadataRoute.Sitemap = users.map((user) => ({
    url: `https://kiasu.co/user/${user.username}`,
    lastModified: user.updatedAt,
  }));

  return [
    { url: 'https://kiasu.co', lastModified: new Date(), priority: 1 },
    {
      url: 'https://kiasu.co/discovery',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...userEntries,
    ...listEntries,
  ];
}
