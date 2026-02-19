import { createElement } from 'react';
import Link from 'next/link';
import { BookOpen, Link2, Lock } from 'lucide-react';
import { Card } from '@/components/ui';
import { getCategoryIcon, CATEGORIES } from '@/lib/categories';

interface ProfileStudyListCardProps {
  list: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    category: string;
    isPublic: boolean;
    _count: { items: number };
    copiedFrom?: { user: { username: string | null } } | null;
  };
  isOwner: boolean;
}

function getCategoryLabel(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? 'Other';
}

export function ProfileStudyListCard({
  list,
  isOwner,
}: ProfileStudyListCardProps) {
  const href = isOwner ? `/dashboard/${list.slug}` : `/share/${list.id}`;

  return (
    <Link href={href}>
      <Card className="group flex h-full flex-col gap-4 p-0 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
        {/* Header: category badge + item count */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {createElement(getCategoryIcon(list.category), {
                className: 'h-3.5 w-3.5',
              })}
              {getCategoryLabel(list.category)}
            </span>
            {!list.isPublic && isOwner && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
            {list.copiedFrom?.user?.username && (
              <span
                className="group/tooltip relative inline-flex items-center text-muted-foreground"
                title={`Saved from ${list.copiedFrom.user.username}`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 max-w-[200px] whitespace-normal rounded bg-foreground px-2 py-1 text-[11px] text-background opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  Saved from {list.copiedFrom.user.username}
                </span>
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            {list._count.items}
          </span>
        </div>

        {/* Body: title + description */}
        <div className="flex-1 px-5 pb-5">
          <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
            {list.title}
          </h3>
          {list.description && (
            <div
              className="notes-content mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: list.description }}
            />
          )}
        </div>
      </Card>
    </Link>
  );
}
