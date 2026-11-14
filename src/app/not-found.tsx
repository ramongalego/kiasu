import { Button, Container } from '@/components/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold tabular-nums text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Go to homepage</Button>
      </Link>
    </Container>
  );
}
