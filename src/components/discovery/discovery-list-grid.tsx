'use client';

import { useState, useTransition } from 'react';
import { DiscoveryStudyListCard } from '@/components/discovery/discovery-study-list-card';
import {
  fetchDiscoveryLists,
  type DiscoveryList,
} from '@/app/discovery/actions';
import { Loader2 } from 'lucide-react';

interface DiscoveryListGridProps {
  initialLists: DiscoveryList[];
  initialNextCursor: string | null;
  category: string | null;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export function DiscoveryListGrid({
  initialLists,
  initialNextCursor,
  category,
  isAuthenticated,
  currentUserId,
}: DiscoveryListGridProps) {
  const [lists, setLists] = useState(initialLists);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!nextCursor) return;
    startTransition(async () => {
      const result = await fetchDiscoveryLists({
        cursor: nextCursor,
        category: category ?? undefined,
      });
      setLists((prev) => [...prev, ...result.lists]);
      setNextCursor(result.nextCursor);
    });
  }

  if (lists.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        No study lists found. Try a different category!
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <DiscoveryStudyListCard
            key={list.id}
            list={list}
            isAuthenticated={isAuthenticated}
            isOwner={currentUserId !== null && list.userId === currentUserId}
          />
        ))}
      </div>

      {nextCursor && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </>
  );
}
