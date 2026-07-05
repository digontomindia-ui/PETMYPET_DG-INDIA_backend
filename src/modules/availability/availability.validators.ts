import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const getAvailabilityQuerySchema = z.object({
  providerId: objectIdSchema,
  serviceId: objectIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
});
