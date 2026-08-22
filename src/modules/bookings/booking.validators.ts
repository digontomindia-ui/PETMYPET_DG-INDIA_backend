import { z } from 'zod';
import { CONSULTATION_MODES } from './booking.constants.js';
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
  durationDays: z.number().int().min(1).max(15).optional(),
  dropOffTime: timeOfDaySchema.optional(),
  pickupTime: timeOfDaySchema.optional(),
  consultationMode: z.enum([CONSULTATION_MODES.CLINIC, CONSULTATION_MODES.ONLINE]).optional(),
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

/** Comma-separated list of BOOKING_STATUSES members, e.g. "PENDING,ACCEPTED,ON_THE_WAY,STARTED"
 * — lets the client ask for an "Upcoming" bucket in one call instead of one request per status.
 * Validated against the real enum in the service layer (parseStatusFilter), not here, since Zod
 * can't easily validate "each comma-separated token is a member of this enum" declaratively. */
export const listBookingsQuerySchema = z.object({
  status: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
