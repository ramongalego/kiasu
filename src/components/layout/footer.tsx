'use client';

import { Container } from '@/components/ui';
import { SupportModal } from '@/components/support/support-modal';
import { Bug } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useSyncExternalStore, useState } from 'react';

const subscribe = () => () => {};

export function Footer() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);

  return (
    <footer className="border-t border-border/50 py-8">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link
          href="/"
          className="flex items-center transition-opacity duration-200 hover:opacity-70"
        >
          {mounted ? (
            <Image
              src={
                resolvedTheme === 'dark' ? '/logo_dark.png' : '/logo_light.png'
              }
              alt="Kiasu"
              width={80}
              height={20}
              className="h-5 w-auto"
            />
          ) : (
            <div className="h-5 w-[80px]" />
          )}
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <Bug className="h-3.5 w-3.5" />
            Report an issue
          </button>
          {/* <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Kiasu. All rights reserved.
          </p> */}
        </div>
      </Container>
      <SupportModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
