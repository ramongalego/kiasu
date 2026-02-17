import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { notFound } from 'next/navigation';
import { Container, Avatar } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { EditProfileButton } from '@/components/profile/edit-profile-button';
import { ProfileStudyListCard } from '@/components/profile/profile-study-list-card';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true },
  });
  if (!user) return { title: 'User Not Found' };
  const displayName = user.name ?? user.username ?? username;
  return {
    title: displayName,
    description: `View ${displayName}'s learning paths on Kiasu.`,
  };
}

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
  let hasPassword = false;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    isOwner = authUser?.id === user.id;
    if (isOwner && authUser) {
      const providers: string[] = authUser.app_metadata?.providers ?? [];
      hasPassword = providers.includes('email');
    }
  } catch {
    // Not authenticated — visitor
  }

  const avatarSrc = user.profilePictureUrl ?? user.avatarUrl ?? null;

  const [studyLists, completedCount, copiedCount] = await Promise.all([
    prisma.studyList.findMany({
      where: isOwner
        ? { userId: user.id }
        : { userId: user.id, isPublic: true },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        isPublic: true,
        position: true,
        _count: { select: { items: true, copies: true } },
        copiedFrom: { select: { user: { select: { username: true } } } },
      },
      orderBy: { position: 'asc' },
    }),
    prisma.studyItem.count({
      where: { studyList: { userId: user.id }, completed: true },
    }),
    prisma.studyList.count({
      where: { copiedFrom: { userId: user.id } },
    }),
  ]);

  const totalItems = studyLists.reduce(
    (sum, list) => sum + list._count.items,
    0,
  );

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
          {isOwner && (
            <div className="mt-3 flex justify-center">
              <EditProfileButton
                currentUsername={user.username ?? username}
                currentEmail={user.email}
                hasPassword={hasPassword}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-t border-border/50">
          <div className="py-4 text-center">
            <p className="text-lg font-semibold">{studyLists.length}</p>
            <p className="text-xs text-muted-foreground">
              {studyLists.length === 1 ? 'List' : 'Lists'}
            </p>
          </div>
          <div className="border-x border-border/50 py-4 text-center">
            <p className="text-lg font-semibold">
              {totalItems > 0
                ? `${Math.round((completedCount / totalItems) * 100)}%`
                : '0%'}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="py-4 text-center">
            <p className="text-lg font-semibold">{copiedCount}</p>
            <p className="text-xs text-muted-foreground">
              {copiedCount === 1 ? 'Save' : 'Saves'}
            </p>
          </div>
        </div>

        {/* Member since */}
        <div className="border-t border-border/50 px-6 py-3 text-center text-xs text-muted-foreground">
          Member since{' '}
          {user.createdAt.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mx-auto mt-10 max-w-4xl">
        <h2 className="mb-4 text-lg font-semibold">Learning Paths</h2>
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
              ? 'You haven\u2019t created any learning paths yet.'
              : 'No public learning paths yet.'}
          </p>
        )}
      </div>
    </Container>
  );
}
