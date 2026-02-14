import { createElement } from 'react';
import Link from 'next/link';
import { BookOpen, Lock } from 'lucide-react';
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
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {list.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
