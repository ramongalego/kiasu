'use client';

import { useTransition, useState } from 'react';
import { Copy, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { copyStudyList } from '@/app/discovery/actions';
import { cn } from '@/lib/utils';

interface CopyStudyListButtonProps {
  studyListId: string;
  variant?: 'icon' | 'button';
}

export function CopyStudyListButton({
  studyListId,
  variant = 'icon',
}: CopyStudyListButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    startTransition(async () => {
      const result = await copyStudyList(studyListId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        setCopied(true);
      }
    });
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleCopy}
        disabled={isPending || copied}
        className={cn(
          'relative z-10 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted',
          isPending && 'opacity-70',
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : copied ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? 'Saved!' : 'Save to my Dashboard'}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      disabled={isPending || copied}
      className="relative z-10 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:text-primary"
      aria-label="Save study list"
      title="Save to my Dashboard"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
