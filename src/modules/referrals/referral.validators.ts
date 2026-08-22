import { z } from 'zod';

export const listReferralHistoryQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
