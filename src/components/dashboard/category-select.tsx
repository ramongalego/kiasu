'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CategorySelectProps {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function CategorySelect({
  id,
  name,
  value,
  onChange,
  hasError,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = CATEGORIES.find((c) => c.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2 text-sm transition-all duration-200 focus:border-border focus:outline-none focus:ring-2 focus:ring-ring',
          hasError ? 'border-destructive' : 'border-border/50',
          !value && 'text-muted-foreground',
        )}
      >
        {selected ? (
          <>
            {createElement(selected.icon, {
              className: 'h-4 w-4 shrink-0 text-primary',
            })}
            <span className="flex-1 text-left">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-left">Select a category</span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border/50 bg-card py-1 shadow-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                onChange(cat.value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted',
                value === cat.value && 'bg-muted/50',
              )}
            >
              {createElement(cat.icon, {
                className: 'h-4 w-4 shrink-0 text-primary',
              })}
              <span className="flex-1 text-left">{cat.label}</span>
              {value === cat.value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
