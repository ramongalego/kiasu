'use client';

import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Plus, Zap } from 'lucide-react';
import { FREE_TIER_LIMITS } from '@/lib/tier-limits';
import { UpgradeModal } from './upgrade-modal';

interface DashboardHeaderProps {
  hasLists: boolean;
  onCreateClick: () => void;
  isPremium: boolean;
  totalCount: number;
  privateCount: number;
}

export function DashboardHeader({
  hasLists,
  onCreateClick,
  isPremium,
  totalCount,
  privateCount,
}: DashboardHeaderProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const atLimit =
    !isPremium &&
    (totalCount >= FREE_TIER_LIMITS.studyLists ||
      privateCount >= FREE_TIER_LIMITS.privateStudyLists);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My learning paths</h1>
          {isPremium ? (
            <div className="mt-3">
              <Badge>Premium</Badge>
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  <span
                    className={
                      totalCount >= FREE_TIER_LIMITS.studyLists
                        ? 'font-medium text-destructive'
                        : ''
                    }
                  >
                    {totalCount}/{FREE_TIER_LIMITS.studyLists}
                  </span>{' '}
                  learning paths
                </span>
                <span>·</span>
                <span>
                  <span
                    className={
                      privateCount >= FREE_TIER_LIMITS.privateStudyLists
                        ? 'font-medium text-destructive'
                        : ''
                    }
                  >
                    {privateCount}/{FREE_TIER_LIMITS.privateStudyLists}
                  </span>{' '}
                  private
                </span>
                {atLimit && (
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="ml-2 flex cursor-pointer items-center gap-1 font-medium text-primary transition-opacity hover:opacity-80"
                  >
                    <Zap className="h-3 w-3" />
                    Upgrade
                  </button>
                )}
              </div>
              {totalCount > FREE_TIER_LIMITS.studyLists && (
                <div className="mt-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  You&apos;re over the free plan limit. You can still open all
                  your learning paths, but you can&apos;t create new ones until
                  you{' '}
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    upgrade
                  </button>{' '}
                  or delete some.
                </div>
              )}
            </>
          )}
        </div>

        {hasLists && (
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            New learning path
          </Button>
        )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        atLimit={atLimit}
      />
    </>
  );
}
