import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return { user: null, isAdmin: false, isPremium: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    select: { id: true, role: true, tier: true },
  });

  return {
    user,
    isAdmin: user?.role === 'admin',
    isPremium: user?.tier === 'premium',
  };
}
