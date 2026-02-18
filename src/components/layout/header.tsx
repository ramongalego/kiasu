'use client';

import { useUser } from '@/hooks/use-user';
import { Button, Container } from '@/components/ui';
import { UserMenu } from '@/components/auth';
import { Moon, Sun, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useSyncExternalStore, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getProfileInfo } from '@/app/(app)/profile/actions';
import { UpgradeModal } from '@/components/dashboard/upgrade-modal';

const subscribe = () => () => {};

export function Header() {
  const { user, loading } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [isPremium, setIsPremium] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    getProfileInfo().then((info) => {
      setIsPremium(info?.isPremium ?? false);
    });
  }, [user]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <Container className="flex h-18 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={user ? '/dashboard' : '/'}
              className="flex items-center transition-opacity duration-200 hover:opacity-80"
            >
              {/* Mobile: icon mark only */}
              <Image
                src="/logo_icon.png"
                alt="Kiasu"
                width={32}
                height={32}
                className="h-8 w-auto sm:hidden"
              />
              {/* Desktop: full logo, theme-aware */}
              {mounted ? (
                <Image
                  src={
                    resolvedTheme === 'dark'
                      ? '/logo_dark.png'
                      : '/logo_light.png'
                  }
                  alt="Kiasu"
                  width={120}
                  height={32}
                  className="hidden h-8 w-auto sm:block"
                />
              ) : (
                <div className="hidden h-8 w-[120px] sm:block" />
              )}
            </Link>

            <nav className="flex items-center gap-4">
              {user && (
                <Link
                  href="/dashboard"
                  className={`hidden text-sm transition-colors duration-200 hover:text-foreground sm:inline ${pathname.startsWith('/dashboard') ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/discovery"
                className={`text-sm transition-colors duration-200 hover:text-foreground ${pathname.startsWith('/discovery') ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Discovery
              </Link>
            </nav>
          </div>

          <nav className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
                className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <>
                {!isPremium && (
                  <Button size="sm" onClick={() => setUpgradeOpen(true)}>
                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                    Upgrade
                  </Button>
                )}
                <UserMenu />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </Container>
      </header>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
