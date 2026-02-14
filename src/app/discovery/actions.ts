'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
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
