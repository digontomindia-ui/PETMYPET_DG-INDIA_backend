import type { z } from 'zod';
import type {
  listOrdersQuerySchema,
  placeOrderSchema,
  updateOrderStatusSchema,
} from './order.validators.js';

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
