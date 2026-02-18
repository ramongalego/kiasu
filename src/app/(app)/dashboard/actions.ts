'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { studyListSchema } from '@/lib/validations/schemas';
import { generateSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { FREE_TIER_LIMITS } from '@/lib/tier-limits';

export async function createStudyList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const parsed = studyListSchema.safeParse({
    title: (formData.get('title') as string) ?? '',
    description: (formData.get('description') as string) ?? '',
    category: (formData.get('category') as string) ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const { title, description, category } = parsed.data;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tier: true },
  });
  const isPremium = dbUser?.tier === 'premium';

  if (!isPremium) {
    const count = await prisma.studyList.count({ where: { userId: user.id } });
    if (count >= FREE_TIER_LIMITS.studyLists) {
      return {
        error: `Free accounts are limited to ${FREE_TIER_LIMITS.studyLists} learning paths.`,
      };
    }
  }

  const isPublic = formData.get('isPublic') === 'true';

  if (!isPremium && !isPublic) {
    const privateCount = await prisma.studyList.count({
      where: { userId: user.id, isPublic: false },
    });
    if (privateCount >= FREE_TIER_LIMITS.privateStudyLists) {
      return {
        error: `Free accounts are limited to ${FREE_TIER_LIMITS.privateStudyLists} private learning paths.`,
      };
    }
  }

  let slug = generateSlug(title);

  // Ensure slug is unique for this user
  const existing = await prisma.studyList.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  await prisma.$transaction([
    // Shift all existing lists down to make room at position 0
    prisma.studyList.updateMany({
      where: { userId: user.id },
      data: { position: { increment: 1 } },
    }),
    prisma.studyList.create({
      data: {
        title,
        description: description || null,
        slug,
        category,
        isPublic,
        position: 0,
        userId: user.id,
      },
    }),
  ]);

  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateStudyList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const id = formData.get('id') as string;

  const parsed = studyListSchema.safeParse({
    title: (formData.get('title') as string) ?? '',
    description: (formData.get('description') as string) ?? '',
    category: (formData.get('category') as string) ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const { title, description, category } = parsed.data;

  // Verify ownership
  const existing = await prisma.studyList.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { error: 'Learning path not found' };
  }

  let slug = existing.slug;
  if (title !== existing.title) {
    slug = generateSlug(title);
    const slugTaken = await prisma.studyList.findFirst({
      where: { userId: user.id, slug, id: { not: id } },
    });
    if (slugTaken) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const isPublic = formData.get('isPublic') === 'true';

  if (!isPublic) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tier: true },
    });
    if (dbUser?.tier !== 'premium') {
      const privateCount = await prisma.studyList.count({
        where: { userId: user.id, isPublic: false, id: { not: id } },
      });
      if (privateCount >= FREE_TIER_LIMITS.privateStudyLists) {
        return {
          error: `Free accounts are limited to ${FREE_TIER_LIMITS.privateStudyLists} private learning paths.`,
        };
      }
    }
  }

  await prisma.studyList.update({
    where: { id },
    data: {
      title,
      description: description || null,
      slug,
      category,
      isPublic,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/${existing.slug}`);
  if (slug !== existing.slug) {
    revalidatePath(`/dashboard/${slug}`);
  }
  return { success: true, slug };
}

export async function deleteStudyList(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const existing = await prisma.studyList.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { error: 'Learning path not found' };
  }

  // Cascade delete handles items automatically
  await prisma.studyList.delete({ where: { id } });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function reorderStudyLists(orderedIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify all lists belong to this user
  const lists = await prisma.studyList.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  const userListIds = new Set(lists.map((l) => l.id));
  if (orderedIds.some((id) => !userListIds.has(id))) {
    return { error: 'Invalid list ID' };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.studyList.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  revalidatePath('/dashboard');
  return { success: true };
}
