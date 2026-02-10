"use client";

import { Button } from "@/components/ui";
import { ArrowLeft, Lock, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface StudyListHeaderProps {
  title: string;
  description: string | null;
  listId: string;
  isPublic: boolean;
  onCreateClick: () => void;
}

export function StudyListHeader({
  title,
  description,
  listId,
  isPublic,
  onCreateClick,
}: StudyListHeaderProps) {
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${listId}`);
    toast.success("Link copied to clipboard");
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

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            {!isPublic && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
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
