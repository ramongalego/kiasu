'use client';

import { createElement } from 'react';
import { Card } from '@/components/ui';
import { EditStudyListModal } from './edit-study-list-modal';
import { getCategoryIcon } from '@/lib/categories';
import { GripVertical, Lock, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OptimisticStudyListWithItemCount } from '@/types';
import { cn } from '@/lib/utils';

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
            'flex h-full flex-col transition-all duration-200 hover:shadow-md hover:shadow-primary/5',
            list.pending && 'pointer-events-none opacity-70',
          )}
        >
          <div className="flex items-start justify-between">
            <Link
              href={`/dashboard/${list.slug}`}
              className="flex cursor-pointer items-center gap-2"
            >
              {createElement(getCategoryIcon(list.category), {
                className: 'h-5 w-5 text-primary',
              })}
              <h3 className="font-semibold leading-none">{list.title}</h3>
              {!list.isPublic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
            </Link>
            <div className="flex items-center gap-0.5">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab rounded-lg p-1 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          {list.description && (
            <p className="mt-4 line-clamp-1 text-sm text-muted-foreground">
              {list.description}
            </p>
          )}

          <p className="mt-auto pt-5 text-xs text-muted-foreground">
            {list._count.items} {list._count.items === 1 ? 'item' : 'items'}
          </p>
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
