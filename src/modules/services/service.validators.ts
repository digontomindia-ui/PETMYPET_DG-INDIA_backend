import { z } from 'zod';
import { env } from '../../common/config/env.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const addOnSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
});

const includedItemSchema = z.object({
  name: z.string().min(1).max(100),
  imageUrl: z.string().url(),
});

export const createServiceSchema = z
  .object({
    categoryId: objectIdSchema,
    name: z.string().min(1).max(150),
    description: z.string().max(2000).default(''),
    price: z.number().min(0),
    originalPrice: z.number().min(0).optional(),
    durationMinutes: z.number().int().min(env.MIN_BOOKING_DURATION_MINUTES, {
      message: `durationMinutes must be at least ${env.MIN_BOOKING_DURATION_MINUTES} minutes`,
    }),
    images: z.array(z.string().url()).default([]),
    includedItems: z.array(includedItemSchema).default([]),
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
    durationMinutes: z.number().int().min(env.MIN_BOOKING_DURATION_MINUTES, {
      message: `durationMinutes must be at least ${env.MIN_BOOKING_DURATION_MINUTES} minutes`,
    }).optional(),
    images: z.array(z.string().url()).optional(),
    includedItems: z.array(includedItemSchema).optional(),
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
