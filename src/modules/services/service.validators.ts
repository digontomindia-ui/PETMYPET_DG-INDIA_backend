import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createServiceSchema = z.object({
  categoryId: objectIdSchema,
  name: z.string().min(1).max(150),
  description: z.string().max(2000).default(''),
  price: z.number().min(0),
  durationMinutes: z.number().int().min(5),
  images: z.array(z.string().url()).default([]),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const searchServicesQuerySchema = z.object({
  categoryId: objectIdSchema.optional(),
  providerId: objectIdSchema.optional(),
  q: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
