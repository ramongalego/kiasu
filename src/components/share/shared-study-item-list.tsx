'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHideCompleted } from '@/hooks/use-hide-completed';
import { Eye, EyeOff, Share2 } from 'lucide-react';
import type { StudyItem } from '@/types';
import { StudyItemRow } from '@/components/dashboard/study-item-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CopyStudyListButton } from '@/components/discovery/copy-study-list-button';
import { Button } from '@/components/ui';
import { toast } from 'sonner';

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
  const [hideCompleted, toggleHideCompleted] = useHideCompleted();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          {isAuthenticated && !isOwner && studyListId && (
            <CopyStudyListButton studyListId={studyListId} variant="button" />
          )}
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar value={progress} label="Progress" />
        {checkedIds.size > 0 && (
          <button
            type="button"
            onClick={toggleHideCompleted}
            className="mt-6 flex cursor-pointer items-center gap-1.5 rounded-lg text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            {hideCompleted ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Show completed
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Hide completed
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {items
          .filter((item) => !hideCompleted || !checkedIds.has(item.id))
          .map((item) => (
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
