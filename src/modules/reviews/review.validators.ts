import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createReviewSchema = z
  .object({
    bookingId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).default(''),
  })
  .refine((data) => Boolean(data.bookingId) !== Boolean(data.productId), {
    message: 'Provide exactly one of bookingId or productId',
    path: ['bookingId'],
  });

export const listReviewsQuerySchema = z
  .object({
    providerId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .refine((data) => Boolean(data.providerId) || Boolean(data.productId), {
    message: 'Provide providerId or productId',
    path: ['providerId'],
  });
