import type { z } from 'zod';
import type {
  createCitySchema,
  createZoneSchema,
  nearbyZoneQuerySchema,
  updateCitySchema,
  updateZoneSchema,
} from './zone.validators.js';

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type NearbyZoneQuery = z.infer<typeof nearbyZoneQuerySchema>;
