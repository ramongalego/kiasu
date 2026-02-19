'use client';

import { Button, RichTextEditor, Spinner } from '@/components/ui';
import { studyItemSchema } from '@/lib/validations/schemas';
import { X, Youtube } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import type { StudyItem } from '@/types';

const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/i;

interface StudyItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  item?: StudyItem;
}

export function StudyItemModal({
  open,
  onClose,
  onSubmit,
  item,
}: StudyItemModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [url, setUrl] = useState(item?.url ?? '');
  const [title, setTitle] = useState(item?.title ?? '');
  const [notesHtml, setNotesHtml] = useState(item?.notes ?? '');
  const [ytTitle, setYtTitle] = useState<string | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const isEdit = !!item;

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    setErrors({});
    setYtTitle(null);
    setYtLoading(false);
    if (!isEdit) {
      setUrl('');
      setTitle('');
      setNotesHtml('');
    }
    onClose();
  }, [onClose, isEdit]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const fetchYouTubeTitle = (videoUrl: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    if (!videoUrl || !YOUTUBE_RE.test(videoUrl)) {
      setYtTitle(null);
      setYtLoading(false);
      return;
    }

    setYtLoading(true);
    setYtTitle(null);

    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/youtube-title?url=${encodeURIComponent(videoUrl)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.title) setYtTitle(data.title);
      })
      .catch(() => {
        // Aborted or network error — ignore
      })
      .finally(() => setYtLoading(false));
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    fetchYouTubeTitle(value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Notes come from controlled state (rich text editor), not a native textarea
    formData.set('notes', notesHtml);
    const result = studyItemSchema.safeParse({
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      notes: notesHtml,
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
    if (!isEdit) {
      formRef.current?.reset();
      setUrl('');
      setTitle('');
      setNotesHtml('');
      setYtTitle(null);
    }
    onClose();
  };

  const prefix = isEdit ? 'edit-' : '';

  const inputClass = (hasError: boolean) =>
    `mt-1 block w-full rounded-xl border ${hasError ? 'border-destructive' : 'border-border/50'} bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit item' : 'Add item'}
          </h2>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-1 transition-colors duration-200 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${prefix}item-title`}
                className="block text-sm font-medium"
              >
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id={`${prefix}item-title`}
                name="title"
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass(!!errors.title)}
                placeholder="e.g. Read Chapter 3"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div>
              <label
                htmlFor={`${prefix}item-url`}
                className="block text-sm font-medium"
              >
                URL
              </label>
              <input
                id={`${prefix}item-url`}
                name="url"
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={inputClass(!!errors.url)}
                placeholder="https://..."
              />
              {errors.url && (
                <p className="mt-1 text-xs text-destructive">{errors.url}</p>
              )}
              {ytLoading && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Spinner className="h-3 w-3" />
                  Fetching video title...
                </p>
              )}
              {ytTitle && !ytLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setTitle(ytTitle);
                    setYtTitle(null);
                  }}
                  className="mt-1.5 flex cursor-pointer items-start gap-1.5 rounded-lg text-left text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Youtube className="h-3.5 w-3.5 shrink-0 self-center text-red-500" />
                  <span className="line-clamp-2">
                    Use &ldquo;{ytTitle}&rdquo; as title
                  </span>
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Notes</label>
              <RichTextEditor
                value={notesHtml}
                onChange={setNotesHtml}
                placeholder="Any extra notes..."
                hasError={!!errors.notes}
              />
              <input type="hidden" name="notes" value={notesHtml} />
              {errors.notes && (
                <p className="mt-1 text-xs text-destructive">{errors.notes}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save' : 'Add item'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
