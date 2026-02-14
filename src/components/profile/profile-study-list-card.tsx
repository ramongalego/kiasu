import { createElement } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui';
import { getCategoryIcon } from '@/lib/categories';

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

export function ProfileStudyListCard({
  list,
  isOwner,
}: ProfileStudyListCardProps) {
  const href = isOwner ? `/dashboard/${list.slug}` : `/share/${list.id}`;

  return (
    <Link href={href}>
      <Card className="flex h-full flex-col transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
        <div className="flex items-center gap-2">
          {createElement(getCategoryIcon(list.category), {
            className: 'h-5 w-5 shrink-0 text-primary',
          })}
          <h3 className="truncate font-semibold leading-none">{list.title}</h3>
          {!list.isPublic && isOwner && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Private
            </span>
          )}
        </div>

        {list.description && (
          <p className="mt-4 line-clamp-1 text-sm text-muted-foreground">
            {list.description}
          </p>
        )}

        <p className="mt-auto pt-5 text-xs text-muted-foreground">
          {list._count.items} {list._count.items === 1 ? 'item' : 'items'}
        </p>
      </Card>
    </Link>
  );
}
