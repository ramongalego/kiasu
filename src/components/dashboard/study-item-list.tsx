'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { toast } from 'sonner';
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
import { ProgressBar } from '@/components/ui';
import { StudyListHeader } from './study-list-header';
import { ItemsEmptyState } from './items-empty-state';
import { StudyItemRow } from './study-item-row';
import { CreateItemModal } from './create-item-modal';
import type { StudyItem, OptimisticStudyItem, StudyItemAction } from '@/types';

interface StudyItemListProps {
  items: StudyItem[];
  studyListId: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
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
}: StudyItemListProps) {
  const [, startTransition] = useTransition();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticItems, dispatch] = useOptimistic(items, itemReducer);

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

  return (
    <>
      <StudyListHeader
        title={title}
        description={description}
        listId={studyListId}
        isPublic={isPublic}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      {total > 0 && (
        <ProgressBar
          value={progress}
          label={`${completed} of ${total} completed`}
          className="mt-6"
        />
      )}

      <div className="mt-8">
        {optimisticItems.length === 0 ? (
          <ItemsEmptyState onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
          <DndContext
            id="study-item-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={optimisticItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {optimisticItems.map((item) => (
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

      <CreateItemModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
