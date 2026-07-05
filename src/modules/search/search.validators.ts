import { z } from 'zod';

export const globalSearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.string().optional(),
});

export const suggestQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.string().optional(),
});
