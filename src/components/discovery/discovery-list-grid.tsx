'use client';

import { useMemo, useState } from 'react';
import { DiscoveryStudyListCard } from '@/components/discovery/discovery-study-list-card';
import { DiscoveryCategoryFilter } from '@/components/discovery/discovery-category-filter';
import { type DiscoveryList } from '@/app/discovery/queries';

const PAGE_SIZE = 24;

interface DiscoveryListGridProps {
  allLists: DiscoveryList[];
  initialCategory: string | null;
  isAuthenticated: boolean;
  currentUserId: string | null;
}

export function DiscoveryListGrid({
  allLists,
  initialCategory,
  isAuthenticated,
  currentUserId,
}: DiscoveryListGridProps) {
  const [category, setCategory] = useState(initialCategory);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () =>
      category
        ? allLists.filter((list) => list.category === category)
        : allLists,
    [allLists, category],
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleCategoryChange(next: string | null) {
    setCategory(next);
    setVisibleCount(PAGE_SIZE);

    // Keep URL in sync for bookmarking/sharing (no navigation)
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('category', next);
    else url.searchParams.delete('category');
    window.history.replaceState({}, '', url);
  }

  return (
    <>
      <DiscoveryCategoryFilter
        active={category}
        onChange={handleCategoryChange}
      />

      {visible.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((list) => (
            <DiscoveryStudyListCard
              key={list.id}
              list={list}
              isAuthenticated={isAuthenticated}
              isOwner={currentUserId !== null && list.userId === currentUserId}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          No learning paths found. Try a different category!
        </p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
