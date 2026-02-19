'use client';

import { Button, RichTextEditor } from '@/components/ui';
import { studyListSchema } from '@/lib/validations/schemas';
import { CategorySelect } from './category-select';
import { X } from 'lucide-react';
import { VisibilityToggle } from './visibility-toggle';
import { useEffect, useRef, useState, type FormEvent } from 'react';

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
  const [category, setCategory] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('description', descriptionHtml);
    const result = studyListSchema.safeParse({
      title: formData.get('title') as string,
      description: descriptionHtml,
      category: formData.get('category') as string,
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
    setCategory('');
    setDescriptionHtml('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create learning path</h2>
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
                className={`mt-1 block w-full rounded-xl border ${errors.title ? 'border-destructive' : 'border-border/50'} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`}
                placeholder="e.g. React Fundamentals"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </label>
              <div className="mt-1">
                <CategorySelect
                  id="category"
                  name="category"
                  value={category}
                  onChange={setCategory}
                  hasError={!!errors.category}
                />
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.category}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <RichTextEditor
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                placeholder="What is this learning path about?"
                hasError={!!errors.description}
              />
              <input type="hidden" name="description" value={descriptionHtml} />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
          <input type="hidden" name="isPublic" value={String(isPublic)} />
          <VisibilityToggle isPublic={isPublic} onChange={setIsPublic} />
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
