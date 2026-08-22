import { z } from 'zod';
import { BOOKING_STATUSES } from './booking.constants.js';
import { BOOKING_PHOTO_PHASES } from './booking.types.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm');

const addOnSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
});

export const createBookingSchema = z.object({
  providerId: objectIdSchema,
  serviceId: objectIdSchema,
  petId: objectIdSchema.optional(),
  scheduledStart: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: 'scheduledStart must be in the future',
  }),
  couponCode: z.string().min(1).max(30).optional(),
  notes: z.string().max(1000).default(''),
  addOns: z.array(addOnSchema).default([]),
  durationDays: z.number().int().min(1).optional(),
  dropOffTime: timeOfDaySchema.optional(),
  pickupTime: timeOfDaySchema.optional(),
});

export const updateProviderNotesSchema = z.object({
  notes: z.string().max(2000),
});

export const addBookingPhotoSchema = z.object({
  url: z.string().url(),
  phase: z.enum([BOOKING_PHOTO_PHASES.BEFORE, BOOKING_PHOTO_PHASES.AFTER]),
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
