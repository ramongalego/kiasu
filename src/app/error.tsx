'use client';

import { Button, Container } from '@/components/ui';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        This page didn&apos;t load. Try again, or go back to your dashboard.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </Container>
  );
}
