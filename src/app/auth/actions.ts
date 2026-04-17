'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { usernameSchema } from '@/lib/validations/schemas';
import { rateLimit, getClientIp, MINUTE_MS } from '@/lib/rate-limit';
import { RATE_LIMIT } from '@/lib/constants';

async function getRateLimitKey(scope: string): Promise<string> {
  const h = await headers();
  return `${scope}:${getClientIp(new Headers(Object.fromEntries(h.entries())))}`;
}

export async function checkUsernameAvailability(username: string) {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return {
      available: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid username',
    };
  }

  const limit = rateLimit(
    await getRateLimitKey('username-check'),
    RATE_LIMIT.USERNAME_CHECK_PER_MIN,
    MINUTE_MS,
  );
  if (!limit.success) {
    return { available: false, error: 'Too many requests. Try again shortly.' };
  }

  const existing = await prisma.user.findFirst({
    where: { username: { equals: parsed.data, mode: 'insensitive' } },
  });

  return { available: !existing, error: null };
}

export async function resolveUsernameToEmail(username: string) {
  const limit = rateLimit(
    await getRateLimitKey('resolve-username'),
    RATE_LIMIT.AUTH_RESOLVE_PER_MIN,
    MINUTE_MS,
  );
  if (!limit.success) {
    return { email: null, error: 'Too many requests. Try again shortly.' };
  }

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return { email: null, error: 'Invalid username' };
  }

  const user = await prisma.user.findFirst({
    where: {
      username: { equals: parsed.data.toLowerCase(), mode: 'insensitive' },
    },
    select: { email: true },
  });

  if (!user) {
    return { email: null, error: 'No account found with that username' };
  }

  return { email: user.email, error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function setUsername(username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid username' };
  }

  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: parsed.data, mode: 'insensitive' },
      id: { not: user.id },
    },
  });

  if (existing) {
    return { error: 'Username is already taken' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { username: parsed.data },
  });

  await supabase.auth.updateUser({
    data: { username: parsed.data },
  });

  return { success: true };
}
