import { Container } from '@/components/ui';
import { BookOpen, Bug } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-8">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <BookOpen className="h-5 w-5" />
          <span className="font-semibold">Kiasu</span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/raygaledev/kiasu/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <Bug className="h-3.5 w-3.5" />
            Report an issue
          </a>
          {/* <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Kiasu. All rights reserved.
          </p> */}
        </div>
      </Container>
    </footer>
  );
}
