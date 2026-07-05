import { z } from 'zod';
import { BOOKING_STATUSES } from './booking.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createBookingSchema = z.object({
  providerId: objectIdSchema,
  serviceId: objectIdSchema,
  petId: objectIdSchema.optional(),
  scheduledStart: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: 'scheduledStart must be in the future',
  }),
  notes: z.string().max(1000).default(''),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const verifyOtpSchema = z.object({
  code: z.string().min(4).max(6),
});

export const listBookingsQuerySchema = z.object({
  status: z
    .enum([
      BOOKING_STATUSES.PENDING,
      BOOKING_STATUSES.ACCEPTED,
      BOOKING_STATUSES.ON_THE_WAY,
      BOOKING_STATUSES.STARTED,
      BOOKING_STATUSES.COMPLETED,
      BOOKING_STATUSES.CANCELLED,
      BOOKING_STATUSES.REFUNDED,
    ])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
