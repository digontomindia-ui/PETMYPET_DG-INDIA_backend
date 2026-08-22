import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const addToCartSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export const productIdParamSchema = z.object({ productId: objectIdSchema });

export const applyCartCouponSchema = z.object({
  code: z.string().min(1).max(30),
});
