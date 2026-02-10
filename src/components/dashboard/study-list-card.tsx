"use client";

import { Card } from "@/components/ui";
import { EditStudyListModal } from "./edit-study-list-modal";
import { BookOpen, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { OptimisticStudyListWithItemCount } from "@/types";
import { cn } from "@/lib/utils";

interface StudyListCardProps {
  list: OptimisticStudyListWithItemCount;
  onEdit: (formData: FormData) => void;
  onDelete: () => void;
}

export function StudyListCard({ list, onEdit, onDelete }: StudyListCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-md hover:shadow-primary/5",
          list.pending && "pointer-events-none opacity-70",
        )}
      >
        <div className="flex items-start justify-between">
          <Link
            href={`/dashboard/${list.slug}`}
            className="flex cursor-pointer items-center gap-2"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{list.title}</h3>
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {list.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {list.description}
          </p>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {list._count.items} {list._count.items === 1 ? "item" : "items"}
        </p>
      </Card>

      <EditStudyListModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        list={list}
        onSubmit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
