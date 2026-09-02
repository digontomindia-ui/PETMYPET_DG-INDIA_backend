import { z } from 'zod';
import { PAYMENT_METHODS } from './payment.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createOrderSchema = z.object({
  method: z.enum([PAYMENT_METHODS.RAZORPAY, PAYMENT_METHODS.WALLET, PAYMENT_METHODS.CASH]),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const bookingIdParamSchema = z.object({ bookingId: objectIdSchema });
export const paymentIdParamSchema = z.object({ id: objectIdSchema });

export const listPaymentsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
