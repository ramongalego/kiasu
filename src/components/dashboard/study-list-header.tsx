'use client';

import { Button } from '@/components/ui';
import { ArrowLeft, Lock, Pencil, Plus, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface StudyListHeaderProps {
  title: string;
  description: string | null;
  listId: string;
  isPublic: boolean;
  onCreateClick: () => void;
  onEditClick: () => void;
}

export function StudyListHeader({
  title,
  description,
  listId,
  isPublic,
  onCreateClick,
  onEditClick,
}: StudyListHeaderProps) {
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${listId}`);
    toast.success('Link copied to clipboard');
  };

  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lists
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold">{title}</h1>
            <button
              onClick={onEditClick}
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {!isPublic && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
          </div>
          {description && (
            <div
              className="notes-content mt-1 text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        </div>
      </div>
    </>
  );
}
