import { createElement } from 'react';
import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';
import { getCategoryIcon, CATEGORIES } from '@/lib/categories';
import { VoteButtons } from '@/components/discovery/vote-buttons';
import { CopyStudyListButton } from '@/components/discovery/copy-study-list-button';
import { BookOpen } from 'lucide-react';

interface DiscoveryStudyListCardProps {
  list: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    _count: { items: number };
    upvotes: number;
    downvotes: number;
    currentUserVote: 'UP' | 'DOWN' | null;
    href: string;
    user: {
      username: string | null;
      profilePictureUrl: string | null;
      avatarUrl: string | null;
    };
  };
  isAuthenticated: boolean;
  isOwner: boolean;
}

function getCategoryLabel(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? 'Other';
}

export function DiscoveryStudyListCard({
  list,
  isAuthenticated,
  isOwner,
}: DiscoveryStudyListCardProps) {
  const avatarSrc = list.user.profilePictureUrl ?? list.user.avatarUrl ?? null;
  const username = list.user.username ?? 'Anonymous';

  return (
    <Card className="group relative flex h-full flex-col gap-4 p-0 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <Link href={list.href} className="absolute inset-0 z-0" />

      {/* Header: category badge + item count */}
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {createElement(getCategoryIcon(list.category), {
            className: 'h-3.5 w-3.5',
          })}
          {getCategoryLabel(list.category)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          {list._count.items}
        </span>
      </div>

      {/* Body: title + description */}
      <div className="flex-1 px-5">
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary transition-colors">
          {list.title}
        </h3>
        {list.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {list.description}
          </p>
        )}
      </div>

      {/* Footer: user + votes */}
      <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
        {list.user.username ? (
          <Link
            href={`/user/${list.user.username}`}
            className="relative z-10 flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Avatar
              src={avatarSrc}
              name={username}
              size="sm"
              className="h-6 w-6 text-[10px]"
            />
            <span className="text-xs font-medium text-muted-foreground">
              {username}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar
              src={avatarSrc}
              name={username}
              size="sm"
              className="h-6 w-6 text-[10px]"
            />
            <span className="text-xs font-medium text-muted-foreground">
              {username}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {isAuthenticated && !isOwner && (
            <CopyStudyListButton studyListId={list.id} />
          )}
          <VoteButtons
            studyListId={list.id}
            upvotes={list.upvotes}
            downvotes={list.downvotes}
            currentUserVote={list.currentUserVote}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </Card>
  );
}
