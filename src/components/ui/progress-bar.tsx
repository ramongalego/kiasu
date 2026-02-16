'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isComplete = clamped === 100;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        {label && <span>{label}</span>}
        <span className="ml-auto">{clamped}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
          style={{
            width: mounted ? `${clamped}%` : '0%',
            transition: 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
      </div>
    </div>
  );
}
