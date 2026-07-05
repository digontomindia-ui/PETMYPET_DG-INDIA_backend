import { z } from 'zod';
import { workingHoursInputSchema } from '../../common/validators/working-hours.validator.js';

export const createCitySchema = z.object({
  name: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(1).max(100).default('India'),
  workingHours: z.array(workingHoursInputSchema).optional(),
});

export const updateCitySchema = createCitySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createZoneSchema = z.object({
  name: z.string().min(1).max(100),
  cityId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid city id'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  radiusMeters: z.number().min(100).max(100_000).default(5000),
});

export const updateZoneSchema = createZoneSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const nearbyZoneQuerySchema = z.object({
  lat: z.string().refine((v) => !Number.isNaN(Number(v)), 'lat must be a number'),
  lng: z.string().refine((v) => !Number.isNaN(Number(v)), 'lng must be a number'),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});
