import { z } from 'zod';
import { ORDER_PAYMENT_METHODS, ORDER_STATUSES } from './order.constants.js';

export const shippingAddressSchema = z.object({
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default('India'),
});

export const placeOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum([ORDER_PAYMENT_METHODS.WALLET, ORDER_PAYMENT_METHODS.CASH_ON_DELIVERY, ORDER_PAYMENT_METHODS.RAZORPAY]),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.SHIPPED,
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.CANCELLED,
  ]),
});

export const listOrdersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
