'use server';

import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { supportTicketSchema } from '@/lib/validations/schemas';

export async function submitSupportTicket(data: {
  type: string;
  message: string;
}): Promise<{ error: string } | { success: true }> {
  const { user } = await getAuthUser();
  if (!user) {
    return { error: 'You must be logged in to submit a ticket' };
  }

  const result = supportTicketSchema.safeParse(data);
  if (!result.success) {
    const firstError =
      result.error.flatten().fieldErrors.message?.[0] ??
      result.error.flatten().fieldErrors.type?.[0] ??
      'Invalid input';
    return { error: firstError };
  }

  await prisma.supportTicket.create({
    data: {
      userId: user.id,
      type: result.data.type,
      message: result.data.message,
    },
  });

  return { success: true };
}
