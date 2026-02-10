"use client";

import { Button } from "@/components/ui";
import { studyListSchema } from "@/lib/validations/schemas";
import { X, Globe, Lock } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

interface CreateStudyListModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export function CreateStudyListModal({
  open,
  onClose,
  onSubmit,
}: CreateStudyListModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublic, setIsPublic] = useState(true);

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
    formRef.current?.reset();
    setIsPublic(true);
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
          <h2 className="text-lg font-semibold">Create study list</h2>
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
              <label htmlFor="title" className="block text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                autoFocus
                className={`mt-1 block w-full rounded-xl border ${errors.title ? "border-destructive" : "border-border/50"} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
                placeholder="e.g. React Fundamentals"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
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
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
