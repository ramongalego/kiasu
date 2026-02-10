"use client";

import { useOptimistic, useTransition, useState } from "react";
import { toast } from "sonner";
import {
  createStudyItem,
  toggleStudyItem,
  deleteStudyItem,
  updateStudyItem,
} from "@/app/(app)/dashboard/[slug]/actions";
import { StudyListHeader } from "./study-list-header";
import { ItemsEmptyState } from "./items-empty-state";
import { StudyItemRow } from "./study-item-row";
import { CreateItemModal } from "./create-item-modal";
import type { StudyItem, OptimisticStudyItem, StudyItemAction } from "@/types";

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
    case "create":
      return [...state, action.item];
    case "toggle":
      return state.map((i) =>
        i.id === action.itemId ? { ...i, completed: !i.completed } : i,
      );
    case "delete":
      return state.filter((i) => i.id !== action.itemId);
    case "update":
      return state.map((i) =>
        i.id === action.itemId ? { ...i, ...action.data } : i,
      );
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
  const [optimisticItems, dispatch] = useOptimistic(items, itemReducer);

  const handleToggle = (itemId: string) => {
    startTransition(async () => {
      dispatch({ type: "toggle", itemId });
      try {
        const result = await toggleStudyItem(itemId, slug);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      dispatch({ type: "delete", itemId });
      try {
        const result = await deleteStudyItem(itemId, slug);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleEdit = (itemId: string, formData: FormData) => {
    const editTitle = (formData.get("title") as string)?.trim() ?? "";
    const notes = (formData.get("notes") as string)?.trim() || null;
    const url = (formData.get("url") as string)?.trim() || null;

    startTransition(async () => {
      dispatch({
        type: "update",
        itemId,
        data: { title: editTitle, notes, url },
      });
      try {
        const result = await updateStudyItem(itemId, slug, formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleCreate = (formData: FormData) => {
    const createTitle = (formData.get("title") as string)?.trim() ?? "";
    const notes = (formData.get("notes") as string)?.trim() || null;
    const url = (formData.get("url") as string)?.trim() || null;

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
      dispatch({ type: "create", item: tempItem });
      try {
        const result = await createStudyItem(studyListId, slug, formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <>
      <StudyListHeader
        title={title}
        description={description}
        listId={studyListId}
        isPublic={isPublic}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      <div className="mt-8">
        {optimisticItems.length === 0 ? (
          <ItemsEmptyState onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
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
