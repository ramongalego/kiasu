"use client";

import { EditItemModal } from "./edit-item-modal";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { OptimisticStudyItem } from "@/types";
import { cn } from "@/lib/utils";
import { UrlIcon } from "@/components/ui/url-icon";

interface StudyItemRowProps {
  item: OptimisticStudyItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (formData: FormData) => void;
}

export function StudyItemRow({
  item,
  onToggle,
  onDelete,
  onEdit,
}: StudyItemRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border/50 p-4 transition-all duration-200 hover:border-border hover:bg-muted/50",
          item.pending && "pointer-events-none opacity-70",
        )}
      >
        <button
          onClick={onToggle}
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-border transition-all duration-200 data-[checked=true]:border-primary data-[checked=true]:bg-primary"
          data-checked={item.completed}
        >
          {item.completed ? (
            <svg
              className="h-3 w-3 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-foreground transition-colors duration-200 hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <UrlIcon url={item.url} />
              <p
                className={`text-sm font-medium ${item.completed ? "text-muted-foreground line-through" : ""}`}
              >
                {item.title}
              </p>
            </a>
          ) : (
            <p
              className={`text-sm font-medium ${item.completed ? "text-muted-foreground line-through" : ""}`}
            >
              {item.title}
            </p>
          )}
          {item.notes && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <EditItemModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={item}
        onSubmit={onEdit}
      />
    </>
  );
}
