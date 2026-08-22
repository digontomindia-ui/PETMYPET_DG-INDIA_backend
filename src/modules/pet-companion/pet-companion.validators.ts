import { z } from 'zod';
import { SWIPE_ACTIONS } from './pet-companion.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const discoverQuerySchema = z.object({
  petId: objectIdSchema,
  lat: z.string(),
  lng: z.string(),
  radiusMeters: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const swipeSchema = z.object({
  swiperPetId: objectIdSchema,
  targetPetId: objectIdSchema,
  action: z.enum([SWIPE_ACTIONS.LIKE, SWIPE_ACTIONS.PASS, SWIPE_ACTIONS.SUPERLIKE]),
});

export const petIdQuerySchema = z.object({
  petId: objectIdSchema,
  page: z.string().optional(),
  limit: z.string().optional(),
});
