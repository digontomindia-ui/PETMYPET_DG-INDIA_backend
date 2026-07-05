import { z } from 'zod';

export const createBlogSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  content: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

export const updateBlogSchema = createBlogSchema.partial();

export const listBlogsQuerySchema = z.object({
  tag: z.string().optional(),
  q: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
export const slugParamSchema = z.object({ slug: z.string().min(1) });
