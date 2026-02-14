'use client';

import { createElement } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/categories';

export function DiscoveryCategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  function select(category: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    router.push(`/discovery?${params.toString()}`);
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <button
        onClick={() => select(null)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 ${
          !active
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
        }`}
      >
        All
      </button>
      {CATEGORIES.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => select(value)}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 ${
            active === value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
          }`}
        >
          {createElement(icon, { className: 'h-3.5 w-3.5' })}
          {label}
        </button>
      ))}
    </div>
  );
}
