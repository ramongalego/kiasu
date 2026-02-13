import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { Container, Avatar } from '@/components/ui';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authUser!.id },
    select: {
      username: true,
      email: true,
      name: true,
      avatarUrl: true,
      profilePictureUrl: true,
      createdAt: true,
    },
  });

  const avatarSrc = user.profilePictureUrl ?? user.avatarUrl ?? null;

  return (
    <Container as='section' className='py-12'>
      <div className='mx-auto max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg'>
        {/* Gradient banner */}
        <div className='relative h-28 bg-gradient-to-r from-indigo-500 to-violet-500'>
          <div className='absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full border-4 border-card shadow-lg shadow-indigo-500/20'>
            <Avatar
              src={avatarSrc}
              name={user.name ?? user.username}
              size='xl'
            />
          </div>
        </div>

        {/* Profile info */}
        <div className='px-6 pb-6 pt-14 text-center'>
          {user.username && (
            <h1 className='text-xl font-semibold'>{user.username}</h1>
          )}
          {user.name && (
            <p className='mt-1 text-sm text-muted-foreground'>{user.name}</p>
          )}
        </div>

        {/* Details */}
        <div className='border-t border-border/50 px-6 py-4'>
          <dl className='space-y-3 text-sm'>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Email</dt>
              <dd className='font-medium'>{user.email}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Member since</dt>
              <dd className='font-medium'>
                {user.createdAt.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  );
}
