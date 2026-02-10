import { Button, Container } from "@/components/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-6xl font-bold text-transparent">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-semibold">Page not found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Go back home</Button>
      </Link>
    </Container>
  );
}
