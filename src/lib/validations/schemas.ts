import { z } from "zod";

const safeText = z
  .string()
  .trim()
  .transform((s) => s.replace(/<[^>]*>/g, ""));

export const studyListSchema = z.object({
  title: safeText.pipe(z.string().min(1, "Title is required").max(200)),
  description: safeText.pipe(z.string().max(1000)).optional().or(z.literal("")),
});

export const studyItemSchema = z.object({
  title: safeText.pipe(z.string().min(1, "Title is required").max(200)),
  url: z
    .string()
    .trim()
    .max(2000)
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  notes: safeText.pipe(z.string().max(2000)).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Must be a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = loginSchema;
