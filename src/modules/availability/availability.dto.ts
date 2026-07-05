import type { z } from 'zod';
import type { getAvailabilityQuerySchema } from './availability.validators.js';

export type GetAvailabilityQuery = z.infer<typeof getAvailabilityQuerySchema>;
