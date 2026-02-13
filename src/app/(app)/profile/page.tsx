import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authUser!.id },
    select: { username: true },
  });

  redirect(`/user/${user.username}`);
}
