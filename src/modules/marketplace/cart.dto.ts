import type { z } from 'zod';
import type { addToCartSchema, updateCartItemSchema } from './cart.validators.js';

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
