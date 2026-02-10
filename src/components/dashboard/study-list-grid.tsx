"use client";

import { useOptimistic, useTransition, useState } from "react";
import { toast } from "sonner";
import {
  createStudyList,
  updateStudyList,
  deleteStudyList,
} from "@/app/(app)/dashboard/actions";
import { generateSlug } from "@/lib/utils";
import { DashboardHeader } from "./dashboard-header";
import { EmptyState } from "./empty-state";
import { StudyListCard } from "./study-list-card";
import { CreateStudyListModal } from "./create-study-list-modal";
import type {
  StudyListWithItemCount,
  OptimisticStudyListWithItemCount,
  StudyListAction,
} from "@/types";

interface StudyListGridProps {
  studyLists: StudyListWithItemCount[];
}

function listReducer(
  state: OptimisticStudyListWithItemCount[],
  action: StudyListAction,
): OptimisticStudyListWithItemCount[] {
  switch (action.type) {
    case "create":
      return [...state, action.list];
    case "update":
      return state.map((l) =>
        l.id === action.listId ? { ...l, ...action.data } : l,
      );
    case "delete":
      return state.filter((l) => l.id !== action.listId);
  }
}

export function StudyListGrid({ studyLists }: StudyListGridProps) {
  const [, startTransition] = useTransition();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [optimisticLists, dispatch] = useOptimistic(studyLists, listReducer);

  const handleCreate = (formData: FormData) => {
    const createTitle = (formData.get("title") as string)?.trim() ?? "";
    const description = (formData.get("description") as string)?.trim() || null;
    const isPublic = formData.get("isPublic") === "true";

    const tempList: OptimisticStudyListWithItemCount = {
      id: `temp-${Date.now()}`,
      title: createTitle,
      description,
      slug: generateSlug(createTitle),
      isPublic,
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { items: 0 },
      pending: true,
    };

    startTransition(async () => {
      dispatch({ type: "create", list: tempList });
      try {
        const result = await createStudyList(formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleEdit = (listId: string, formData: FormData) => {
    const editTitle = (formData.get("title") as string)?.trim() ?? "";
    const description = (formData.get("description") as string)?.trim() || null;
    const isPublic = formData.get("isPublic") === "true";

    startTransition(async () => {
      dispatch({
        type: "update",
        listId,
        data: { title: editTitle, description, isPublic },
      });
      try {
        const result = await updateStudyList(formData);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleDelete = (listId: string) => {
    startTransition(async () => {
      dispatch({ type: "delete", listId });
      try {
        const result = await deleteStudyList(listId);
        if (result.error) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <>
      <DashboardHeader
        hasLists={optimisticLists.length > 0}
        onCreateClick={() => setCreateModalOpen(true)}
      />

      <div className="mt-8">
        {optimisticLists.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
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
