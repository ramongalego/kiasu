'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  createStudyList,
  updateStudyList,
  deleteStudyList,
  reorderStudyLists,
} from '@/app/(app)/dashboard/actions';
import { generateSlug } from '@/lib/utils';
import { DashboardHeader } from './dashboard-header';
import { EmptyState } from './empty-state';
import { StudyListCard } from './study-list-card';
import { CreateStudyListModal } from './create-study-list-modal';
import type {
  StudyListWithItemCount,
  OptimisticStudyListWithItemCount,
  StudyListAction,
} from '@/types';

interface StudyListGridProps {
  studyLists: StudyListWithItemCount[];
  isPremium: boolean;
}

function listReducer(
  state: OptimisticStudyListWithItemCount[],
  action: StudyListAction,
): OptimisticStudyListWithItemCount[] {
  switch (action.type) {
    case 'create':
      return [action.list, ...state];
    case 'update':
      return state.map((l) =>
        l.id === action.listId ? { ...l, ...action.data } : l,
      );
    case 'delete':
      return state.filter((l) => l.id !== action.listId);
    case 'reorder': {
      const byId = new Map(state.map((l) => [l.id, l]));
      return action.orderedIds
        .map((id) => byId.get(id))
        .filter(Boolean) as OptimisticStudyListWithItemCount[];
    }
  }
}

export function StudyListGrid({ studyLists, isPremium }: StudyListGridProps) {
  const [, startTransition] = useTransition();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [optimisticLists, dispatch] = useOptimistic(studyLists, listReducer);

  const totalCount = optimisticLists.length;
  const privateCount = optimisticLists.filter((l) => !l.isPublic).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = optimisticLists.findIndex((l) => l.id === active.id);
    const newIndex = optimisticLists.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(optimisticLists, oldIndex, newIndex);
    const orderedIds = reordered.map((l) => l.id);

    startTransition(async () => {
      dispatch({ type: 'reorder', orderedIds });
      try {
        const result = await reorderStudyLists(orderedIds);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleCreate = (formData: FormData) => {
    const createTitle = (formData.get('title') as string)?.trim() ?? '';
    const description = (formData.get('description') as string)?.trim() || null;
    const isPublic = formData.get('isPublic') === 'true';

    const category = (formData.get('category') as string) ?? 'other';

    const tempList: OptimisticStudyListWithItemCount = {
      id: `temp-${Date.now()}`,
      title: createTitle,
      description,
      slug: generateSlug(createTitle),
      category,
      isPublic,
      position: 0,
      userId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { items: 0, completedItems: 0 },
      pending: true,
    };

    startTransition(async () => {
      dispatch({ type: 'create', list: tempList });
      try {
        const result = await createStudyList(formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleEdit = (listId: string, formData: FormData) => {
    const editTitle = (formData.get('title') as string)?.trim() ?? '';
    const description = (formData.get('description') as string)?.trim() || null;
    const category = (formData.get('category') as string) ?? 'other';
    const isPublic = formData.get('isPublic') === 'true';

    startTransition(async () => {
      dispatch({
        type: 'update',
        listId,
        data: { title: editTitle, description, category, isPublic },
      });
      try {
        const result = await updateStudyList(formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  const handleDelete = (listId: string) => {
    startTransition(async () => {
      dispatch({ type: 'delete', listId });
      try {
        const result = await deleteStudyList(listId);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  return (
    <>
      <DashboardHeader
        hasLists={optimisticLists.length > 0}
        onCreateClick={() => setCreateModalOpen(true)}
        isPremium={isPremium}
        totalCount={totalCount}
        privateCount={privateCount}
      />

      <div className="mt-8">
        {optimisticLists.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
          <DndContext
            id="study-list-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={optimisticLists.map((l) => l.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {optimisticLists.map((list) => (
                  <StudyListCard
                    key={list.id}
                    list={list}
                    onEdit={(fd) => handleEdit(list.id, fd)}
                    onDelete={() => handleDelete(list.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <CreateStudyListModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
