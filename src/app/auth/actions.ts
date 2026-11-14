'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { loginSchema, usernameSchema } from '@/lib/validations/schemas';
import { rateLimit, getClientIp, MINUTE_MS } from '@/lib/rate-limit';
import { RATE_LIMIT } from '@/lib/constants';

const INVALID_CREDENTIALS = 'Wrong email, username or password.';

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

/**
 * Signs in with an email or a username. Username lookup happens here on the
 * server so a user's email is never sent to the browser.
 */
export async function signInWithIdentifier(input: {
  identifier: string;
  password: string;
}) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Enter your email or username and password.' };
  }

  const limit = rateLimit(
    await getRateLimitKey('sign-in'),
    RATE_LIMIT.AUTH_RESOLVE_PER_MIN,
    MINUTE_MS,
  );
  if (!limit.success) {
    return { error: 'Too many sign-in attempts. Try again in a minute.' };
  }

  const { identifier, password } = parsed.data;
  let email = identifier;

  if (!identifier.includes('@')) {
    const username = usernameSchema.safeParse(identifier);
    const user = username.success
      ? await prisma.user.findFirst({
          where: {
            username: { equals: username.data, mode: 'insensitive' },
          },
          select: { email: true },
        })
      : null;
    if (!user) return { error: INVALID_CREDENTIALS };
    email = user.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.code === 'email_not_confirmed'
          ? 'Confirm your email first. Check your inbox for the link.'
          : INVALID_CREDENTIALS,
    };
  }

  return { error: null };
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
