'use client';

import { useTransition } from 'react';
import { X } from 'lucide-react';
import { dismissDowngradeNotice } from '@/app/(app)/dashboard/actions';

interface DowngradeNoticeBannerProps {
  privatizedCount: number;
}

export function DowngradeNoticeBanner({
  privatizedCount,
}: DowngradeNoticeBannerProps) {
  const [isPending, startTransition] = useTransition();

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissDowngradeNotice();
    });
  };

  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
      <p>
        <span className="font-medium">
          {privatizedCount}{' '}
          {privatizedCount === 1
            ? 'of your private learning paths was'
            : 'of your private learning paths were'}{' '}
          made public
        </span>{' '}
        because your Premium subscription ended. You can make them private again
        by upgrading.
      </p>
      <button
        onClick={handleDismiss}
        disabled={isPending}
        className="mt-0.5 shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
