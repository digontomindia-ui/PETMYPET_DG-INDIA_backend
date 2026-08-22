import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { reviewController } from './review.controller.js';
import { createReviewSchema, listReviewsQuerySchema } from './review.validators.js';

export const reviewRoutes = Router();

/**
 * @openapi
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for a provider or a product
 *     description: >
 *       Provide either `providerId` (booking reviews for that provider) or
 *       `productId` (reviews left on that product) — exactly one is required.
 *     parameters:
 *       - name: providerId
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         description: Required if `productId` is not provided.
 *         example: "64f8b9c0d1e2f3a4b5c6d7e8"
 *       - name: productId
 *         in: query
 *         required: false
 *         schema: { type: string }
 *         description: Required if `providerId` is not provided.
 *         example: "64fb1234abcd5678ef901234"
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Reviews listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta: { type: object }
 *             examples:
 *               providerReviews:
 *                 summary: Reviews for a provider (booking reviews)
 *                 value:
 *                   success: true
 *                   message: Success
 *                   data:
 *                     - id: "64fa1b2c3d4e5f6a7b8c9d0e"
 *                       bookingId: "64f207a8b9c0d1e2f3a4b5c7"
 *                       productId: null
 *                       userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                       providerId: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                       rating: 5
 *                       comment: "Excellent grooming service, my dog looked amazing!"
 *                       createdAt: "2026-07-30T14:20:00.000Z"
 *                   meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *               productReviews:
 *                 summary: Reviews for a product
 *                 value:
 *                   success: true
 *                   message: Success
 *                   data:
 *                     - id: "64fa9988d1e2f3a4b5c6d7e9"
 *                       bookingId: null
 *                       productId: "64fb1234abcd5678ef901234"
 *                       userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                       providerId: null
 *                       rating: 4
 *                       comment: "Good quality kibble, my cat loves it."
 *                       createdAt: "2026-08-10T09:12:00.000Z"
 *                   meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "Provide providerId or productId"
 */
reviewRoutes.get(
  '/',
  validate({ query: listReviewsQuerySchema }),
  reviewController.listForProvider,
);
/**
 * @openapi
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Leave a rating and review for a completed booking, or for a product
 *     description: >
 *       Provide either `bookingId` (review a completed booking) or `productId`
 *       (review a product) — exactly one is required, never both.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId: { type: string, description: "Required if productId is not provided" }
 *               productId: { type: string, description: "Required if bookingId is not provided" }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string, maxLength: 2000 }
 *             required: [rating]
 *           examples:
 *             bookingReview:
 *               summary: Review a completed booking
 *               value:
 *                 bookingId: "64f207a8b9c0d1e2f3a4b5c7"
 *                 rating: 5
 *                 comment: "Excellent grooming service, my dog looked amazing!"
 *             productReview:
 *               summary: Review a product
 *               value:
 *                 productId: "64fb1234abcd5678ef901234"
 *                 rating: 4
 *                 comment: "Good quality kibble, my cat loves it."
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             examples:
 *               bookingReview:
 *                 summary: Booking review created
 *                 value:
 *                   success: true
 *                   message: Review submitted
 *                   data:
 *                     id: "64fa1b2c3d4e5f6a7b8c9d0e"
 *                     bookingId: "64f207a8b9c0d1e2f3a4b5c7"
 *                     productId: null
 *                     userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                     providerId: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                     rating: 5
 *                     comment: "Excellent grooming service, my dog looked amazing!"
 *                     createdAt: "2026-08-04T08:45:00.000Z"
 *               productReview:
 *                 summary: Product review created
 *                 value:
 *                   success: true
 *                   message: Review submitted
 *                   data:
 *                     id: "64fa9988d1e2f3a4b5c6d7e9"
 *                     bookingId: null
 *                     productId: "64fb1234abcd5678ef901234"
 *                     userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                     providerId: null
 *                     rating: 4
 *                     comment: "Good quality kibble, my cat loves it."
 *                     createdAt: "2026-08-10T09:12:00.000Z"
 *       400:
 *         description: Invalid review payload (e.g. both or neither of bookingId/productId), or booking not eligible for review
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "You can only review completed bookings"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 *       409:
 *         description: Review already exists for this booking or product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: CONFLICT
 *               message: "You have already reviewed this product"
 */
reviewRoutes.post(
  '/',
  authenticate,
  validate({ body: createReviewSchema }),
  reviewController.create,
);
