'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import {
  studyItemSchema,
  idSchema,
  idArraySchema,
} from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import { sanitizeRichText } from '@/lib/sanitize-rich-text';

export async function createStudyItem(
  studyListId: string,
  slug: string,
  formData: FormData,
) {
  const listIdParsed = idSchema.safeParse(studyListId);
  if (!listIdParsed.success) {
    return { error: 'Invalid list ID' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const list = await prisma.studyList.findFirst({
    where: { id: listIdParsed.data, userId: user.id },
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
  const cleanNotes = sanitizeRichText(notes);

  // Get next position
  const lastItem = await prisma.studyItem.findFirst({
    where: { studyListId },
    orderBy: { position: 'desc' },
  });

  await prisma.studyItem.create({
    data: {
      title,
      notes: cleanNotes,
      url: url || null,
      position: (lastItem?.position ?? -1) + 1,
      studyListId: listIdParsed.data,
    },
  });

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleStudyItem(itemId: string, slug: string) {
  const parsed = idSchema.safeParse(itemId);
  if (!parsed.success) {
    return { error: 'Invalid item ID' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const item = await prisma.studyItem.findUnique({
    where: { id: parsed.data },
    include: { studyList: { select: { userId: true } } },
  });

  if (!item || item.studyList.userId !== user.id) {
    return { error: 'Item not found' };
  }

  await prisma.studyItem.update({
    where: { id: parsed.data },
    data: { completed: !item.completed },
  });

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteStudyItem(itemId: string, slug: string) {
  const parsed = idSchema.safeParse(itemId);
  if (!parsed.success) {
    return { error: 'Invalid item ID' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const item = await prisma.studyItem.findUnique({
    where: { id: parsed.data },
    include: { studyList: { select: { userId: true } } },
  });

  if (!item || item.studyList.userId !== user.id) {
    return { error: 'Item not found' };
  }

  await prisma.studyItem.delete({ where: { id: parsed.data } });

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateStudyItem(
  itemId: string,
  slug: string,
  formData: FormData,
) {
  const idParsed = idSchema.safeParse(itemId);
  if (!idParsed.success) {
    return { error: 'Invalid item ID' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const item = await prisma.studyItem.findUnique({
    where: { id: idParsed.data },
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
  const cleanNotes = sanitizeRichText(notes);

  await prisma.studyItem.update({
    where: { id: idParsed.data },
    data: {
      title,
      notes: cleanNotes,
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
  const listIdParsed = idSchema.safeParse(studyListId);
  if (!listIdParsed.success) {
    return { error: 'Invalid list ID' };
  }

  const idsParsed = idArraySchema.safeParse(orderedIds);
  if (!idsParsed.success) {
    return { error: 'Invalid item IDs' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const list = await prisma.studyList.findFirst({
    where: { id: listIdParsed.data, userId: user.id },
  });

  if (!list) {
    return { error: 'Learning path not found' };
  }

  const items = await prisma.studyItem.findMany({
    where: { studyListId: listIdParsed.data },
    select: { id: true },
  });

  const listItemIds = new Set(items.map((i) => i.id));
  if (idsParsed.data.some((id) => !listItemIds.has(id))) {
    return { error: 'Invalid item ID' };
  }

  await prisma.$transaction(
    idsParsed.data.map((id, index) =>
      prisma.studyItem.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}
