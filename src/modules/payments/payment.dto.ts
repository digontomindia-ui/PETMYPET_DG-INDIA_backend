import type { z } from 'zod';
import type { createOrderSchema } from './payment.validators.js';

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface RazorpayOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}
