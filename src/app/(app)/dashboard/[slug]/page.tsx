import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { Container } from "@/components/ui";
import { StudyItemList } from "@/components/dashboard/study-item-list";
import { notFound } from "next/navigation";

export default async function StudyListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const studyList = await prisma.studyList.findFirst({
    where: { slug, userId: user!.id },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  });

  if (!studyList) {
    notFound();
  }

  return (
    <Container as="section" className="py-8">
      <StudyItemList
        items={studyList.items}
        studyListId={studyList.id}
        slug={slug}
        title={studyList.title}
        description={studyList.description}
        isPublic={studyList.isPublic}
      />
    </Container>
  );
}
