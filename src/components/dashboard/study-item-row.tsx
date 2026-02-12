'use client';

import { EditItemModal } from './edit-item-modal';
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OptimisticStudyItem } from '@/types';
import { cn } from '@/lib/utils';
import { UrlIcon } from '@/components/ui/url-icon';

interface StudyItemRowProps {
  item: OptimisticStudyItem;
  onToggle: () => void;
  onDelete?: () => void;
  onEdit?: (formData: FormData) => void;
  readOnly?: boolean;
}

export function StudyItemRow({
  item,
  onToggle,
  onDelete,
  onEdit,
  readOnly,
}: StudyItemRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const notesRef = useRef<HTMLParagraphElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    const el = notesRef.current;
    if (el && !expanded) {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    }
  }, [item.notes, expanded]);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-border/50 p-4 transition-all duration-200 hover:border-border hover:bg-muted/50',
          item.pending && 'pointer-events-none opacity-70',
          isDragging && 'z-50 opacity-80',
        )}
      >
        <button
          onClick={onToggle}
          className='flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-border transition-all duration-200 data-[checked=true]:border-primary data-[checked=true]:bg-primary'
          data-checked={item.completed}
        >
          {item.completed ? (
            <svg
              className='h-3 w-3 text-primary-foreground'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={3}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M5 13l4 4L19 7'
              />
            </svg>
          ) : null}
        </button>

        <div className='min-w-0 flex-1'>
          {item.url ? (
            <a
              href={item.url}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 text-foreground transition-colors duration-200 hover:text-primary'
              onClick={e => e.stopPropagation()}
            >
              <UrlIcon url={item.url} />
              <p
                className={`text-sm font-medium ${item.completed ? 'text-muted-foreground line-through' : ''}`}
              >
                {item.title}
              </p>
            </a>
          ) : (
            <p
              className={`text-sm font-medium ${item.completed ? 'text-muted-foreground line-through' : ''}`}
            >
              {item.title}
            </p>
          )}
          {item.notes && (
            <div className='mt-1.5'>
              <p
                ref={notesRef}
                className={cn(
                  'text-xs text-muted-foreground',
                  !expanded && 'truncate',
                )}
              >
                {item.notes}
              </p>
              {isOverflowing && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setExpanded(prev => !prev);
                  }}
                  className='mt-2 flex w-full cursor-pointer items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
                >
                  {expanded ? (
                    <>
                      <ChevronUp className='h-3 w-3' />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className='h-3 w-3' />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {!readOnly && (
          <div className='flex shrink-0 items-center gap-1'>
            <button
              {...attributes}
              {...listeners}
              className='cursor-grab rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:cursor-grabbing'
            >
              <GripVertical className='h-4 w-4' />
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className='cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground'
            >
              <Pencil className='h-4 w-4' />
            </button>
            <button
              onClick={onDelete}
              className='cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>

      {!readOnly && onEdit && (
        <EditItemModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          item={item}
          onSubmit={onEdit}
        />
      )}
    </>
  );
}
