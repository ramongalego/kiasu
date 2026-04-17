'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { generateSlug } from '@/lib/utils';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { idSchema, uuidSchema } from '@/lib/validations/schemas';
import { rateLimit, MINUTE_MS } from '@/lib/rate-limit';
import { RATE_LIMIT } from '@/lib/constants';

const voteSchema = z.object({
  studyListId: uuidSchema,
  type: z.enum(['UP', 'DOWN']),
});

export async function voteStudyList(studyListId: string, type: 'UP' | 'DOWN') {
  const parsed = voteSchema.safeParse({ studyListId, type });
  if (!parsed.success) {
    return { error: 'Invalid vote parameters' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const limit = rateLimit(
    `vote:${user.id}`,
    RATE_LIMIT.VOTE_PER_MIN,
    MINUTE_MS,
  );
  if (!limit.success) {
    return { error: 'Too many vote actions. Try again shortly.' };
  }

  // Verify the study list exists and is public
  const studyList = await prisma.studyList.findFirst({
    where: { id: studyListId, isPublic: true },
    select: { id: true },
  });

  if (!studyList) {
    return { error: 'Learning path not found' };
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
  const parsed = idSchema.safeParse(studyListId);
  if (!parsed.success) {
    return { error: 'Invalid list ID' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const limit = rateLimit(
    `copy:${user.id}`,
    RATE_LIMIT.COPY_PER_MIN,
    MINUTE_MS,
  );
  if (!limit.success) {
    return { error: 'Too many copy actions. Try again shortly.' };
  }

  const source = await prisma.studyList.findFirst({
    where: { id: studyListId, isPublic: true },
    include: { items: { orderBy: { position: 'asc' } } },
  });

  if (!source) {
    return { error: 'Learning path not found' };
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

export async function adminHideList(listId: string) {
  const parsed = uuidSchema.safeParse(listId);
  if (!parsed.success) {
    return { error: 'Invalid list ID' };
  }

  const { isAdmin } = await getAuthUser();
  if (!isAdmin) {
    return { error: 'Unauthorized' };
  }

  await prisma.studyList.update({
    where: { id: parsed.data },
    data: { isPublic: false },
  });

  revalidatePath('/discovery');
  return { success: true };
}

export async function adminDeleteList(listId: string) {
  const parsed = uuidSchema.safeParse(listId);
  if (!parsed.success) {
    return { error: 'Invalid list ID' };
  }

  const { isAdmin } = await getAuthUser();
  if (!isAdmin) {
    return { error: 'Unauthorized' };
  }

  await prisma.studyList.delete({
    where: { id: parsed.data },
  });

  revalidatePath('/discovery');
  return { success: true };
}
