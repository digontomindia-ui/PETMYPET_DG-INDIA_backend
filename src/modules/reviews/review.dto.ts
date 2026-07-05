import type { z } from 'zod';
import type { createReviewSchema, listReviewsQuerySchema } from './review.validators.js';

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
