import type { z } from 'zod';
import type { dateRangeQuerySchema, topServicesQuerySchema } from './analytics.validators.js';

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type TopServicesQuery = z.infer<typeof topServicesQuerySchema>;
