'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

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
