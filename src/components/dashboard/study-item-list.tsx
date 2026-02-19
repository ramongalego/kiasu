'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { useHideCompleted } from '@/hooks/use-hide-completed';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  createStudyItem,
  toggleStudyItem,
  deleteStudyItem,
  updateStudyItem,
  reorderStudyItems,
} from '@/app/(app)/dashboard/[slug]/actions';
import {
  updateStudyList,
  deleteStudyList,
} from '@/app/(app)/dashboard/actions';
import { ProgressBar } from '@/components/ui';
import { StudyListHeader } from './study-list-header';
import { ItemsEmptyState } from './items-empty-state';
import { StudyItemRow } from './study-item-row';
import { StudyItemModal } from './study-item-modal';
import { EditStudyListModal } from './edit-study-list-modal';
import type { StudyItem, OptimisticStudyItem, StudyItemAction } from '@/types';

interface StudyItemListProps {
  items: StudyItem[];
  studyListId: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  category: string;
  updatedAt: Date;
}

function itemReducer(
  state: OptimisticStudyItem[],
  action: StudyItemAction,
): OptimisticStudyItem[] {
  switch (action.type) {
    case 'create':
      return [...state, action.item];
    case 'toggle':
      return state.map((i) =>
        i.id === action.itemId ? { ...i, completed: !i.completed } : i,
      );
    case 'delete':
      return state.filter((i) => i.id !== action.itemId);
    case 'update':
      return state.map((i) =>
        i.id === action.itemId ? { ...i, ...action.data } : i,
      );
    case 'reorder': {
      const byId = new Map(state.map((i) => [i.id, i]));
      return action.orderedIds
        .map((id) => byId.get(id))
        .filter(Boolean) as OptimisticStudyItem[];
    }
  }
}

export function StudyItemList({
  items,
  studyListId,
  slug,
  title,
  description,
  isPublic,
  category,
  updatedAt,
}: StudyItemListProps) {
  const [, startTransition] = useTransition();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hideCompleted, toggleHideCompleted] = useHideCompleted();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticItems, dispatch] = useOptimistic(items, itemReducer);
  const router = useRouter();

  const handleEditStudyList = async (formData: FormData) => {
    try {
      const result = await updateStudyList(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.slug && result.slug !== slug) {
        router.replace(`/dashboard/${result.slug}`);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleDeleteStudyList = async () => {
    try {
      const result = await deleteStudyList(studyListId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.replace('/dashboard');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = optimisticItems.findIndex((i) => i.id === active.id);
    const newIndex = optimisticItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(optimisticItems, oldIndex, newIndex);
    const orderedIds = reordered.map((i) => i.id);

    startTransition(async () => {
      dispatch({ type: 'reorder', orderedIds });
      try {
        const result = await reorderStudyItems(studyListId, slug, orderedIds);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleToggle = (itemId: string) => {
    startTransition(async () => {
      dispatch({ type: 'toggle', itemId });
      try {
        const result = await toggleStudyItem(itemId, slug);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      dispatch({ type: 'delete', itemId });
      try {
        const result = await deleteStudyItem(itemId, slug);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleEdit = (itemId: string, formData: FormData) => {
    const editTitle = (formData.get('title') as string)?.trim() ?? '';
    const notes = (formData.get('notes') as string)?.trim() || null;
    const url = (formData.get('url') as string)?.trim() || null;

    startTransition(async () => {
      dispatch({
        type: 'update',
        itemId,
        data: { title: editTitle, notes, url },
      });
      try {
        const result = await updateStudyItem(itemId, slug, formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleCreate = (formData: FormData) => {
    const createTitle = (formData.get('title') as string)?.trim() ?? '';
    const notes = (formData.get('notes') as string)?.trim() || null;
    const url = (formData.get('url') as string)?.trim() || null;

    const tempItem: OptimisticStudyItem = {
      id: `temp-${Date.now()}`,
      title: createTitle,
      notes,
      url,
      completed: false,
      position: optimisticItems.length,
      studyListId,
      createdAt: new Date(),
      updatedAt: new Date(),
      pending: true,
    };

    startTransition(async () => {
      dispatch({ type: 'create', item: tempItem });
      try {
        const result = await createStudyItem(studyListId, slug, formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const completed = optimisticItems.filter((i) => i.completed).length;
  const total = optimisticItems.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const visibleItems = hideCompleted
    ? optimisticItems.filter((i) => !i.completed)
    : optimisticItems;

  return (
    <>
      <StudyListHeader
        title={title}
        description={description}
        listId={studyListId}
        isPublic={isPublic}
        onCreateClick={() => setCreateModalOpen(true)}
        onEditClick={() => setEditModalOpen(true)}
      />

      <p className="mt-4 text-xs text-muted-foreground">
        Last updated:{' '}
        {new Date(updatedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      {total > 0 && (
        <div className="mt-4">
          <ProgressBar
            value={progress}
            label={`${completed} of ${total} completed`}
          />
          {completed > 0 && (
            <button
              type="button"
              onClick={toggleHideCompleted}
              className="mt-6 flex cursor-pointer items-center gap-1.5 rounded-lg text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {hideCompleted ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Show completed ({completed})
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
      )}

      <div className="mt-8">
        {optimisticItems.length === 0 ? (
          <ItemsEmptyState onCreateClick={() => setCreateModalOpen(true)} />
        ) : visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            All items completed. Nice work!
          </p>
        ) : (
          <DndContext
            id="study-item-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {visibleItems.map((item) => (
                  <StudyItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item.id)}
                    onDelete={() => handleDelete(item.id)}
                    onEdit={(fd) => handleEdit(item.id, fd)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeId ? (
                <StudyItemRow
                  item={optimisticItems.find((i) => i.id === activeId)!}
                  onToggle={() => {}}
                  readOnly
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <StudyItemModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <EditStudyListModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        list={{
          id: studyListId,
          title,
          description,
          slug,
          category,
          isPublic,
          position: 0,
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            items: optimisticItems.length,
            completedItems: optimisticItems.filter((i) => i.completed).length,
          },
        }}
        onSubmit={handleEditStudyList}
        onDelete={handleDeleteStudyList}
      />
    </>
  );
}
