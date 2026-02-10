"use client";

import { Button } from "@/components/ui";
import { studyListSchema } from "@/lib/validations/schemas";
import { X, Trash2, Globe, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { StudyListWithItemCount } from "@/types";

interface EditStudyListModalProps {
  open: boolean;
  onClose: () => void;
  list: StudyListWithItemCount;
  onSubmit: (formData: FormData) => void;
  onDelete: () => void;
}

export function EditStudyListModal({
  open,
  onClose,
  list,
  onSubmit,
  onDelete,
}: EditStudyListModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublic, setIsPublic] = useState(list.isPublic);

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = studyListSchema.safeParse({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });

    if (!result.success) {
      const flat = result.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        const msg = msgs?.[0];
        if (msg) fieldErrors[key] = msg;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    setConfirmDelete(false);
    onClose();
  };

  const handleClose = () => {
    setConfirmDelete(false);
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit study list</h2>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-1 transition-colors duration-200 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={list.id} />
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="edit-title"
                name="title"
                type="text"
                autoFocus
                defaultValue={list.title}
                className={`mt-1 block w-full rounded-xl border ${errors.title ? "border-destructive" : "border-border/50"} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                rows={3}
                defaultValue={list.description ?? ""}
                className={`mt-1 block w-full resize-none rounded-xl border ${errors.description ? "border-destructive" : "border-border/50"} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
                placeholder="What is this study list about?"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
          <input type="hidden" name="isPublic" value={String(isPublic)} />
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/50 p-3 text-left transition-colors duration-200 hover:bg-muted/50"
          >
            {isPublic ? (
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isPublic ? "Public" : "Private"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPublic
                  ? "Anyone with the link can view this list"
                  : "Only you can see this list"}
              </p>
            </div>
          </button>
          {confirmDelete ? (
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                This will permanently delete <strong>{list.title}</strong> and
                all {list._count.items}{" "}
                {list._count.items === 1 ? "item" : "items"} inside it. This
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Yes, delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  list._count.items > 0
                    ? setConfirmDelete(true)
                    : handleDelete()
                }
                className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
