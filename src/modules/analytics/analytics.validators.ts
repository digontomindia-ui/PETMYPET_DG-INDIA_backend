import { z } from 'zod';

export const dateRangeQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const topServicesQuerySchema = z.object({
  limit: z.string().optional(),
});
