import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createReviewSchema = z
  .object({
    bookingId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
    petId: objectIdSchema.optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).default(''),
  })
  .refine(
    (data) => [data.bookingId, data.productId, data.petId].filter(Boolean).length === 1,
    {
      message: 'Provide exactly one of bookingId, productId, or petId',
      path: ['bookingId'],
    },
  );

export const listReviewsQuerySchema = z
  .object({
    providerId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
    petId: objectIdSchema.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .refine(
    (data) => Boolean(data.providerId) || Boolean(data.productId) || Boolean(data.petId),
    {
      message: 'Provide providerId, productId, or petId',
      path: ['providerId'],
    },
  );
