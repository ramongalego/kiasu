'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { voteStudyList } from '@/app/discovery/actions';
import { cn } from '@/lib/utils';

type VoteType = 'UP' | 'DOWN';

interface VoteButtonsProps {
  studyListId: string;
  upvotes: number;
  downvotes: number;
  currentUserVote: VoteType | null;
}

interface VoteState {
  upvotes: number;
  downvotes: number;
  currentUserVote: VoteType | null;
}

export function VoteButtons({
  studyListId,
  upvotes,
  downvotes,
  currentUserVote,
}: VoteButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic<VoteState, VoteType>(
    { upvotes, downvotes, currentUserVote },
    (state, votedType) => {
      if (state.currentUserVote === votedType) {
        return {
          upvotes: state.upvotes - (votedType === 'UP' ? 1 : 0),
          downvotes: state.downvotes - (votedType === 'DOWN' ? 1 : 0),
          currentUserVote: null,
        };
      }
      if (state.currentUserVote === null) {
        return {
          upvotes: state.upvotes + (votedType === 'UP' ? 1 : 0),
          downvotes: state.downvotes + (votedType === 'DOWN' ? 1 : 0),
          currentUserVote: votedType,
        };
      }
      return {
        upvotes:
          state.upvotes +
          (votedType === 'UP' ? 1 : 0) -
          (votedType === 'DOWN' ? 1 : 0),
        downvotes:
          state.downvotes +
          (votedType === 'DOWN' ? 1 : 0) -
          (votedType === 'UP' ? 1 : 0),
        currentUserVote: votedType,
      };
    },
  );

  const score = optimistic.upvotes - optimistic.downvotes;

  function handleVote(type: VoteType) {
    if (currentUserVote === undefined) {
      router.push('/login');
      return;
    }

    startTransition(async () => {
      setOptimistic(type);
      await voteStudyList(studyListId, type);
    });
  }

  return (
    <div className="relative z-10 flex items-center gap-0.5 rounded-full bg-muted/80 px-1.5 py-0.5">
      <button
        onClick={() => handleVote('UP')}
        disabled={isPending}
        className={cn(
          'cursor-pointer rounded-full p-0.5 transition-colors hover:text-primary',
          optimistic.currentUserVote === 'UP'
            ? 'text-primary'
            : 'text-muted-foreground',
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp
          className={cn(
            'h-5 w-5',
            optimistic.currentUserVote === 'UP' && 'fill-current',
          )}
        />
      </button>

      <span className="min-w-[1.25rem] text-center text-xs font-semibold tabular-nums text-foreground">
        {score}
      </span>

      <button
        onClick={() => handleVote('DOWN')}
        disabled={isPending}
        className={cn(
          'cursor-pointer rounded-full p-0.5 transition-colors hover:text-destructive',
          optimistic.currentUserVote === 'DOWN'
            ? 'text-destructive'
            : 'text-muted-foreground',
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown
          className={cn(
            'h-5 w-5',
            optimistic.currentUserVote === 'DOWN' && 'fill-current',
          )}
        />
      </button>
    </div>
  );
}
