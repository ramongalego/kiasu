'use client';

import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  hasLists: boolean;
  onCreateClick: () => void;
}

export function DashboardHeader({
  hasLists,
  onCreateClick,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">My Learning Paths</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and organize your learning paths
        </p>
      </div>
      {hasLists && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          New list
        </Button>
      )}
    </div>
  );
}
