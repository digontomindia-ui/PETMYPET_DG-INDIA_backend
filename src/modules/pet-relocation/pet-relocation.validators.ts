import { z } from 'zod';
import { RELOCATION_STATUSES, TIME_SLOTS, TRANSPORT_TYPES } from './pet-relocation.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

function isTodayOrFuture(date: Date): boolean {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date >= startOfToday;
}

export const createRelocationRequestSchema = z.object({
  ownerName: z.string().min(1).max(120),
  ownerPhone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
  ownerEmail: z.string().email(),
  petId: objectIdSchema,
  originAddress: z.string().min(1).max(500),
  destinationAddress: z.string().min(1).max(500),
  relocationDate: z.coerce
    .date()
    .refine(isTodayOrFuture, 'relocationDate must be today or in the future'),
  transportType: z.enum([TRANSPORT_TYPES.ROAD, TRANSPORT_TYPES.AIR, TRANSPORT_TYPES.RAIL]),
  preferredTimeSlot: z.enum([TIME_SLOTS.MORNING, TIME_SLOTS.AFTERNOON, TIME_SLOTS.EVENING]),
});

export const updateRelocationStatusSchema = z.object({
  status: z.enum([
    RELOCATION_STATUSES.CONTACTED,
    RELOCATION_STATUSES.CONFIRMED,
    RELOCATION_STATUSES.CANCELLED,
  ]),
  adminNotes: z.string().min(0).max(2000).optional(),
});

export const listRelocationRequestsQuerySchema = z.object({
  status: z
    .enum([
      RELOCATION_STATUSES.SUBMITTED,
      RELOCATION_STATUSES.CONTACTED,
      RELOCATION_STATUSES.CONFIRMED,
      RELOCATION_STATUSES.CANCELLED,
    ])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const listMyRelocationRequestsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
