"use client";

import { Button } from "@/components/ui";
import { X } from "lucide-react";
import { useRef, type FormEvent } from "react";

interface CreateItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export function CreateItemModal({
  open,
  onClose,
  onSubmit,
}: CreateItemModalProps) {
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string)?.trim();
    if (!title) return;
    onSubmit(formData);
    formRef.current?.reset();
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
          <h2 className="text-lg font-semibold">Add item</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 transition-colors duration-200 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="item-title" className="block text-sm font-medium">
                Title
              </label>
              <input
                id="item-title"
                name="title"
                type="text"
                required
                autoFocus
                className="mt-1 block w-full rounded-xl border border-border/50 bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                placeholder="e.g. Read Chapter 3"
              />
            </div>
            <div>
              <label htmlFor="item-url" className="block text-sm font-medium">
                URL (optional)
              </label>
              <input
                id="item-url"
                name="url"
                type="url"
                className="mt-1 block w-full rounded-xl border border-border/50 bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                placeholder="https://..."
              />
            </div>
            <div>
              <label htmlFor="item-notes" className="block text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                id="item-notes"
                name="notes"
                rows={3}
                className="mt-1 block w-full resize-none rounded-xl border border-border/50 bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                placeholder="Any extra notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add item</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
