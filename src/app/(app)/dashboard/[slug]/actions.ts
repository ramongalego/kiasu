'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { studyItemSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function createStudyItem(
  studyListId: string,
  slug: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership
  const list = await prisma.studyList.findFirst({
    where: { id: studyListId, userId: user.id },
  });

  if (!list) {
    return { error: 'Learning path not found' };
  }

  const parsed = studyItemSchema.safeParse({
    title: (formData.get('title') as string) ?? '',
    url: (formData.get('url') as string) ?? '',
    notes: (formData.get('notes') as string) ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const { title, url, notes } = parsed.data;

  // Get next position
  const lastItem = await prisma.studyItem.findFirst({
    where: { studyListId },
    orderBy: { position: 'desc' },
  });

  await prisma.studyItem.create({
    data: {
      title,
      notes: notes || null,
      url: url || null,
      position: (lastItem?.position ?? -1) + 1,
      studyListId,
    },
  });

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleStudyItem(itemId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const item = await prisma.studyItem.findUnique({
    where: { id: itemId },
    include: { studyList: { select: { userId: true } } },
  });

  if (!item || item.studyList.userId !== user.id) {
    return { error: 'Item not found' };
  }

  await prisma.studyItem.update({
    where: { id: itemId },
    data: { completed: !item.completed },
  });

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteStudyItem(itemId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const item = await prisma.studyItem.findUnique({
    where: { id: itemId },
    include: { studyList: { select: { userId: true } } },
  });

  if (!item || item.studyList.userId !== user.id) {
    return { error: 'Item not found' };
  }

  await prisma.studyItem.delete({ where: { id: itemId } });

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateStudyItem(
  itemId: string,
  slug: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const item = await prisma.studyItem.findUnique({
    where: { id: itemId },
    include: { studyList: { select: { userId: true } } },
  });

  if (!item || item.studyList.userId !== user.id) {
    return { error: 'Item not found' };
  }

  const parsed = studyItemSchema.safeParse({
    title: (formData.get('title') as string) ?? '',
    url: (formData.get('url') as string) ?? '',
    notes: (formData.get('notes') as string) ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const { title, url, notes } = parsed.data;

  await prisma.studyItem.update({
    where: { id: itemId },
    data: {
      title,
      notes: notes || null,
      url: url || null,
    },
  });

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}

export async function reorderStudyItems(
  studyListId: string,
  slug: string,
  orderedIds: string[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify the study list belongs to the user
  const list = await prisma.studyList.findFirst({
    where: { id: studyListId, userId: user.id },
  });

  if (!list) {
    return { error: 'Learning path not found' };
  }

  // Verify all item IDs belong to this study list
  const items = await prisma.studyItem.findMany({
    where: { studyListId },
    select: { id: true },
  });

  const listItemIds = new Set(items.map((i) => i.id));
  if (orderedIds.some((id) => !listItemIds.has(id))) {
    return { error: 'Invalid item ID' };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.studyItem.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}
