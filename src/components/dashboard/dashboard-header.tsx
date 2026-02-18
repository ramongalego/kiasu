'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Plus, Sparkles, Zap } from 'lucide-react';
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
          <h1 className="text-2xl font-bold">My Learning Paths</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and organize your learning paths
          </p>
          {isPremium ? (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm shadow-amber-500/30">
                <Sparkles className="h-3 w-3" />
                Premium
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground/60">
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
                Learning Paths
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
                Private Learning Paths
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
          )}
        </div>

        {hasLists && (
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            New list
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
