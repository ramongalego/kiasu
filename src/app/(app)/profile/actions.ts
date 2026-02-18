'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { revalidatePath } from 'next/cache';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '@/lib/validations/schemas';

export async function getProfileInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profilePictureUrl: true, username: true, tier: true },
  });

  return {
    profilePictureUrl: dbUser?.profilePictureUrl ?? null,
    username: dbUser?.username ?? null,
    isPremium: dbUser?.tier === 'premium',
  };
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function uploadProfilePicture(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  if (file.size > MAX_SIZE) {
    return { error: 'Image must be under 2 MB' };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  // Delete previous uploads for this user
  const { data: existing } = await supabase.storage
    .from('profile-pictures')
    .list(user.id);

  if (existing?.length) {
    await supabase.storage
      .from('profile-pictures')
      .remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  const { error: uploadError } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { error: 'Upload failed. Please try again.' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);

  await prisma.user.update({
    where: { id: user.id },
    data: { profilePictureUrl: publicUrl },
  });

  revalidatePath('/profile');
  return { success: true, url: publicUrl };
}

export async function updateUsername(username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const parsed = updateProfileSchema.shape.username.safeParse(username);
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

  revalidatePath('/');
  return { success: true, username: parsed.data };
}

export async function updateEmail(email: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const parsed = updateProfileSchema.shape.email.safeParse(email);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid email' };
  }

  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: parsed.data, mode: 'insensitive' },
      id: { not: user.id },
    },
  });

  if (existing) {
    return { error: 'Email is already taken' };
  }

  const { error: supabaseError } = await supabase.auth.updateUser({
    email: parsed.data,
  });

  if (supabaseError) {
    return { error: supabaseError.message };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email: parsed.data },
  });

  revalidatePath('/');
  return { success: true, confirmationRequired: true };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { error: 'Current password is incorrect' };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
