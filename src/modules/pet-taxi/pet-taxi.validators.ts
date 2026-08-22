import { z } from 'zod';
import { PET_TAXI_STATUSES, PET_TAXI_TRIP_TYPES } from './pet-taxi.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

function isTodayOrFuture(value: string): boolean {
  const date = new Date(value);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date >= startOfToday;
}

export const createPetTaxiBookingSchema = z.object({
  tripType: z.enum([PET_TAXI_TRIP_TYPES.ONE_WAY, PET_TAXI_TRIP_TYPES.ROUND_TRIP]),
  petIds: z.array(objectIdSchema).min(1, 'At least one pet is required'),
  pickupAddress: z.string().min(1).max(500),
  dropAddress: z.string().min(1).max(500),
  pickupDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid pickupDate')
    .refine(isTodayOrFuture, 'pickupDate must be today or a future date'),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, 'pickupTime must be in HH:mm format'),
});

export const cancelPetTaxiBookingSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const listMyPetTaxiBookingsQuerySchema = z.object({
  status: z
    .enum([
      PET_TAXI_STATUSES.PENDING,
      PET_TAXI_STATUSES.CONFIRMED,
      PET_TAXI_STATUSES.COMPLETED,
      PET_TAXI_STATUSES.CANCELLED,
    ])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
