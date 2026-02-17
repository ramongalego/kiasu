import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { Container } from '@/components/ui';
import { notFound } from 'next/navigation';
import { Lock } from 'lucide-react';
import { SharedStudyItemList } from '@/components/share/shared-study-item-list';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const list = await prisma.studyList.findFirst({
    where: { id },
    select: { title: true, description: true },
  });
  if (!list) return { title: 'List Not Found' };
  return {
    title: list.title,
    description: list.description || `Study list: ${list.title}`,
  };
}

export default async function SharedStudyListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const studyList = await prisma.studyList.findFirst({
    where: { id },
    include: {
      items: { orderBy: { position: 'asc' } },
    },
  });

  if (!studyList) {
    notFound();
  }

  let isAuthenticated = false;
  let isOwner = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isAuthenticated = true;
      isOwner = studyList.userId === user.id;
    }
  } catch {
    // Not authenticated
  }

  if (!studyList.isPublic) {
    return (
      <Container as="section" className="py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">This list is private</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The owner has made this learning path private. Only they can view
            its contents.
          </p>
        </div>
      </Container>
    );
  }

  const items = studyList.items.map((item) => ({
    ...item,
    completed: false,
  }));

  return (
    <Container as="section" className="py-8">
      <SharedStudyItemList
        listId={studyList.id}
        title={studyList.title}
        description={studyList.description}
        items={items}
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        studyListId={studyList.id}
      />
    </Container>
  );
}
