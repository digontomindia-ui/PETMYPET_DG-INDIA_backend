import { z } from 'zod';
import { WEEKDAYS } from '../schemas/working-hours.schema.js';

export const workingHoursInputSchema = z.object({
  day: z.enum(WEEKDAYS),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean().default(false),
});
