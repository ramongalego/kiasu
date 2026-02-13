import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { notFound } from 'next/navigation';
import { Container, Avatar } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { ProfileStudyListCard } from '@/components/profile/profile-study-list-card';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatarUrl: true,
      profilePictureUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Check if the viewer is the profile owner (non-blocking — visitors are fine)
  let isOwner = false;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    isOwner = authUser?.id === user.id;
  } catch {
    // Not authenticated — visitor
  }

  const avatarSrc = user.profilePictureUrl ?? user.avatarUrl ?? null;

  const studyLists = await prisma.studyList.findMany({
    where: isOwner ? { userId: user.id } : { userId: user.id, isPublic: true },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      category: true,
      isPublic: true,
      position: true,
      _count: { select: { items: true } },
    },
    orderBy: { position: 'asc' },
  });

  return (
    <Container as="section" className="py-12">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
        {/* Gradient banner */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-500 to-violet-500">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full border-4 border-card shadow-lg shadow-indigo-500/20">
            {isOwner ? (
              <ProfileAvatar
                src={avatarSrc}
                name={user.name ?? user.username}
              />
            ) : (
              <Avatar
                src={avatarSrc}
                name={user.name ?? user.username}
                size="xl"
              />
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6 pt-14 text-center">
          {user.username && (
            <h1 className="text-xl font-semibold">{user.username}</h1>
          )}
          {user.name && (
            <p className="mt-1 text-sm text-muted-foreground">{user.name}</p>
          )}
        </div>

        {/* Details */}
        <div className="border-t border-border/50 px-6 py-4">
          <dl className="space-y-3 text-sm">
            {isOwner && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium">
                {user.createdAt.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Study Lists */}
      <div className="mx-auto mt-10 max-w-4xl">
        <h2 className="mb-4 text-lg font-semibold">Study Lists</h2>
        {studyLists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studyLists.map((list) => (
              <ProfileStudyListCard
                key={list.id}
                list={list}
                isOwner={isOwner}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? 'You haven\u2019t created any study lists yet.'
              : 'No public study lists yet.'}
          </p>
        )}
      </div>
    </Container>
  );
}
