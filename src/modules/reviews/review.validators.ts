import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createReviewSchema = z.object({
  bookingId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).default(''),
});

export const listReviewsQuerySchema = z.object({
  providerId: objectIdSchema,
  page: z.string().optional(),
  limit: z.string().optional(),
});
