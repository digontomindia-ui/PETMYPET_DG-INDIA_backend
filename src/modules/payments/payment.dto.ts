import type { z } from 'zod';
import type { createOrderSchema, verifyPaymentSchema } from './payment.validators.js';

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export interface RazorpayOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}
