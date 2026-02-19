'use client';

import { createElement } from 'react';
import { Card } from '@/components/ui';
import { EditStudyListModal } from './edit-study-list-modal';
import { getCategoryIcon, CATEGORIES } from '@/lib/categories';
import { BookOpen, GripVertical, Link2, Lock, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OptimisticStudyListWithItemCount } from '@/types';
import { cn } from '@/lib/utils';

function getCategoryLabel(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? 'Other';
}

interface StudyListCardProps {
  list: OptimisticStudyListWithItemCount;
  onEdit: (formData: FormData) => void;
  onDelete: () => void;
}

export function StudyListCard({ list, onEdit, onDelete }: StudyListCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn('h-full', isDragging && 'z-50 opacity-80')}
      >
        <Card
          className={cn(
            'group flex h-full flex-col gap-4 p-0 transition-all duration-200 hover:shadow-md hover:shadow-primary/5',
            list.pending && 'pointer-events-none opacity-70',
          )}
        >
          {/* Header: category badge + item count */}
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {createElement(getCategoryIcon(list.category), {
                  className: 'h-3.5 w-3.5',
                })}
                {getCategoryLabel(list.category)}
              </span>
              {!list.isPublic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
              {list.copiedFrom?.user?.username && (
                <span
                  className="group/tooltip relative inline-flex items-center text-muted-foreground"
                  title={`Saved from ${list.copiedFrom.user.username}`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 max-w-[200px] whitespace-normal rounded bg-foreground px-2 py-1 text-[11px] text-background opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                    Saved from {list.copiedFrom.user.username}
                  </span>
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              {list._count.items}
            </span>
          </div>

          {/* Body: title + description */}
          <Link href={`/dashboard/${list.slug}`} className="flex-1 px-5">
            <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
              {list.title}
            </h3>
            {list.description && (
              <div
                className="notes-content mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: list.description }}
              />
            )}
          </Link>

          {/* Footer: progress + actions */}
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-2.5">
            {list._count.items > 0 ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      list._count.completedItems === list._count.items
                        ? 'bg-emerald-500'
                        : 'bg-primary',
                    )}
                    style={{
                      width: `${Math.round((list._count.completedItems / list._count.items) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {list._count.completedItems}/{list._count.items}
                </span>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-0.5">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <EditStudyListModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        list={list}
        onSubmit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
