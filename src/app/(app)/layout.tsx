import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { usernameSchema } from '@/lib/validations/schemas';

async function claimSignupUsername(
  userId: string,
  candidate: unknown,
): Promise<boolean> {
  const parsed = usernameSchema.safeParse(candidate);
  if (!parsed.success) return false;

  const taken = await prisma.user.findFirst({
    where: { username: { equals: parsed.data, mode: 'insensitive' } },
    select: { id: true },
  });
  if (taken) return false;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username: parsed.data },
    });
    return true;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return false;
    }
    throw err;
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user exists in our database
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    select: { username: true },
  });

  if (!dbUser.username) {
    // Signup stores the chosen username in user metadata, which the client
    // controls, so validate it and check it's free before using it.
    const claimed = await claimSignupUsername(
      user.id,
      user.user_metadata?.username,
    );
    if (!claimed) redirect('/choose-username');
  }

  return <>{children}</>;
}
