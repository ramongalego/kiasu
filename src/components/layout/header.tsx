'use client';

import { useUser } from '@/hooks/use-user';
import { Button, Container } from '@/components/ui';
import { UserMenu } from '@/components/auth';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { user, loading } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <Container className="flex h-18 items-center justify-between">
        <Link
          href={user ? '/dashboard' : '/'}
          className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80"
        >
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Kiasu</span>
        </Link>

        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <UserMenu />
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
  );
}
