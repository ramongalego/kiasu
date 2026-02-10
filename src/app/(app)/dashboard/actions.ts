"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { studyListSchema } from "@/lib/validations/schemas";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createStudyList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = studyListSchema.safeParse({
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const { title, description } = parsed.data;

  let slug = generateSlug(title);

  // Ensure slug is unique for this user
  const existing = await prisma.studyList.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const isPublic = formData.get("isPublic") === "true";

  await prisma.studyList.create({
    data: {
      title,
      description: description || null,
      slug,
      isPublic,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudyList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const id = formData.get("id") as string;

  const parsed = studyListSchema.safeParse({
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const { title, description } = parsed.data;

  // Verify ownership
  const existing = await prisma.studyList.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { error: "Study list not found" };
  }

  let slug = existing.slug;
  if (title !== existing.title) {
    slug = generateSlug(title);
    const slugTaken = await prisma.studyList.findFirst({
      where: { userId: user.id, slug, id: { not: id } },
    });
    if (slugTaken) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const isPublic = formData.get("isPublic") === "true";

  await prisma.studyList.update({
    where: { id },
    data: {
      title,
      description: description || null,
      slug,
      isPublic,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteStudyList(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const existing = await prisma.studyList.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { error: "Study list not found" };
  }

  // Cascade delete handles items automatically
  await prisma.studyList.delete({ where: { id } });

  revalidatePath("/dashboard");
  return { success: true };
}
