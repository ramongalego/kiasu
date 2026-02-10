import { Container } from "@/components/ui";
import { BookOpen } from "lucide-react";
import Link from "next/link";

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

        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Kiasu. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
