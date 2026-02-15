'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StudyItem } from '@/types';
import { StudyItemRow } from '@/components/dashboard/study-item-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CopyStudyListButton } from '@/components/discovery/copy-study-list-button';

interface SharedStudyItemListProps {
  listId: string;
  title: string;
  description: string | null;
  items: StudyItem[];
  isAuthenticated?: boolean;
  isOwner?: boolean;
  studyListId?: string;
}

const storageKey = (listId: string) => `kiasu-shared-progress-${listId}`;

function readCheckedIds(listId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(listId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {
    // ignore corrupt data
  }
  return new Set();
}

export function SharedStudyItemList({
  listId,
  title,
  description,
  items,
  isAuthenticated = false,
  isOwner = false,
  studyListId,
}: SharedStudyItemListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCheckedIds(readCheckedIds(listId));
  }, [listId]);

  const toggle = useCallback(
    (itemId: string) => {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        localStorage.setItem(storageKey(listId), JSON.stringify([...next]));
        return next;
      });
    },
    [listId],
  );

  const progress = useMemo(
    () =>
      items.length === 0
        ? 0
        : Math.round((checkedIds.size / items.length) * 100),
    [checkedIds.size, items.length],
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        {isAuthenticated && !isOwner && studyListId && (
          <CopyStudyListButton studyListId={studyListId} variant="button" />
        )}
      </div>

      <ProgressBar value={progress} label="Progress" className="mt-6" />

      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <StudyItemRow
            key={item.id}
            item={{ ...item, completed: checkedIds.has(item.id) }}
            onToggle={() => toggle(item.id)}
            readOnly
          />
        ))}
      </div>
    </>
  );
}
