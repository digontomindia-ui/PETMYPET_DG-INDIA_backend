import { z } from 'zod';
import { PRODUCT_CATEGORIES } from './product.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(3000).default(''),
  category: z.enum([
    PRODUCT_CATEGORIES.FOOD,
    PRODUCT_CATEGORIES.PHARMACY,
    PRODUCT_CATEGORIES.ACCESSORIES,
    PRODUCT_CATEGORIES.GROOMING_SUPPLIES,
    PRODUCT_CATEGORIES.TOYS,
    PRODUCT_CATEGORIES.OTHER,
  ]),
  price: z.number().min(0),
  images: z.array(z.string().url()).default([]),
  stock: z.number().int().min(0).default(0),
  sku: z.string().min(1).max(50),
  providerId: objectIdSchema.optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const searchProductsQuerySchema = z.object({
  category: z.string().optional(),
  providerId: objectIdSchema.optional(),
  q: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
