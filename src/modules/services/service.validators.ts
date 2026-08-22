import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const addOnSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
});

export const createServiceSchema = z
  .object({
    categoryId: objectIdSchema,
    name: z.string().min(1).max(150),
    description: z.string().max(2000).default(''),
    price: z.number().min(0),
    originalPrice: z.number().min(0).optional(),
    durationMinutes: z.number().int().min(5),
    images: z.array(z.string().url()).default([]),
    addOnCatalog: z.array(addOnSchema).default([]),
  })
  .refine((data) => data.originalPrice === undefined || data.originalPrice >= data.price, {
    message: 'originalPrice must be greater than or equal to price',
    path: ['originalPrice'],
  });

export const updateServiceSchema = z
  .object({
    categoryId: objectIdSchema.optional(),
    name: z.string().min(1).max(150).optional(),
    description: z.string().max(2000).optional(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    durationMinutes: z.number().int().min(5).optional(),
    images: z.array(z.string().url()).optional(),
    addOnCatalog: z.array(addOnSchema).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.originalPrice === undefined ||
      data.price === undefined ||
      data.originalPrice >= data.price,
    { message: 'originalPrice must be greater than or equal to price', path: ['originalPrice'] },
  );

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
