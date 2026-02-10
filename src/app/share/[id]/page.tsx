import { prisma } from "@/lib/prisma/client";
import { Container } from "@/components/ui";
import { notFound } from "next/navigation";
import { ExternalLink, Lock } from "lucide-react";

export default async function SharedStudyListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const studyList = await prisma.studyList.findFirst({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  });

  if (!studyList) {
    notFound();
  }

  if (!studyList.isPublic) {
    return (
      <Container as="section" className="py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">This list is private</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The owner has made this study list private. Only they can view its
            contents.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container as="section" className="py-8">
      <div>
        <h1 className="text-2xl font-bold">{studyList.title}</h1>
        {studyList.description && (
          <p className="mt-1 text-muted-foreground">{studyList.description}</p>
        )}
      </div>

      <div className="mt-8 space-y-2">
        {studyList.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-border/50 p-4"
          >
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border data-[checked=true]:border-primary data-[checked=true]:bg-primary"
              data-checked={item.completed}
            >
              {item.completed ? (
                <svg
                  className="h-3 w-3 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${item.completed ? "text-muted-foreground line-through" : ""}`}
              >
                {item.title}
              </p>
              {item.notes && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </div>

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}
