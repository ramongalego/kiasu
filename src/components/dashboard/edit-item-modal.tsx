"use client";

import { Button } from "@/components/ui";
import { studyItemSchema } from "@/lib/validations/schemas";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { StudyItem } from "@/types";

interface EditItemModalProps {
  open: boolean;
  onClose: () => void;
  item: StudyItem;
  onSubmit: (formData: FormData) => void;
}

export function EditItemModal({
  open,
  onClose,
  item,
  onSubmit,
}: EditItemModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = studyItemSchema.safeParse({
      title: formData.get("title") as string,
      url: formData.get("url") as string,
      notes: formData.get("notes") as string,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit item</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 transition-colors duration-200 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-item-title"
                className="block text-sm font-medium"
              >
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="edit-item-title"
                name="title"
                type="text"
                autoFocus
                defaultValue={item.title}
                className={`mt-1 block w-full rounded-xl border ${errors.title ? "border-destructive" : "border-border/50"} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-item-url"
                className="block text-sm font-medium"
              >
                URL
              </label>
              <input
                id="edit-item-url"
                name="url"
                type="text"
                defaultValue={item.url ?? ""}
                className={`mt-1 block w-full rounded-xl border ${errors.url ? "border-destructive" : "border-border/50"} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
                placeholder="https://..."
              />
              {errors.url && (
                <p className="mt-1 text-xs text-destructive">{errors.url}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-item-notes"
                className="block text-sm font-medium"
              >
                Notes
              </label>
              <textarea
                id="edit-item-notes"
                name="notes"
                rows={3}
                defaultValue={item.notes ?? ""}
                className={`mt-1 block w-full resize-none rounded-xl border ${errors.notes ? "border-destructive" : "border-border/50"} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
                placeholder="Any extra notes..."
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-destructive">{errors.notes}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
