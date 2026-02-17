import { z } from 'zod';
import { CATEGORY_VALUES } from '@/lib/category-values';

const safeText = z
  .string()
  .trim()
  .transform((s) => s.replace(/[<>]/g, ''));

export const studyListSchema = z.object({
  title: safeText.pipe(z.string().min(1, 'Title is required').max(200)),
  description: safeText.pipe(z.string().max(1000)).optional().or(z.literal('')),
  category: z
    .string()
    .refine(
      (val): val is (typeof CATEGORY_VALUES)[number] =>
        CATEGORY_VALUES.includes(val as (typeof CATEGORY_VALUES)[number]),
      { message: 'Category is required' },
    ),
});

export const studyItemSchema = z.object({
  title: safeText.pipe(z.string().min(1, 'Title is required').max(200)),
  url: z
    .string()
    .trim()
    .max(2000)
    .url('Must be a valid URL')
    .refine(
      (url) => /^https?:\/\//i.test(url),
      'URL must start with http:// or https://',
    )
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return !parsed.username && !parsed.password;
      } catch {
        return false;
      }
    }, 'Invalid URL')
    .optional()
    .or(z.literal('')),
  notes: safeText.pipe(z.string().max(2000)).optional().or(z.literal('')),
});

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores',
  );

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().trim().email('Must be a valid email'),
  username: usernameSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const chooseUsernameSchema = z.object({
  username: usernameSchema,
});

export const updateProfileSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email('Must be a valid email'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
