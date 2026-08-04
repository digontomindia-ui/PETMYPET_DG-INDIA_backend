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
 *     summary: List a provider's reviews
 *     parameters:
 *       - name: providerId
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "64f8b9c0d1e2f3a4b5c6d7e8"
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
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64fa1b2c3d4e5f6a7b8c9d0e"
 *                   bookingId: "64f207a8b9c0d1e2f3a4b5c7"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   providerId: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                   rating: 5
 *                   comment: "Excellent grooming service, my dog looked amazing!"
 *                   createdAt: "2026-07-30T14:20:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "providerId: Invalid id"
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
 *     summary: Leave a rating and review for a completed booking
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string, maxLength: 2000 }
 *             required: [bookingId, rating]
 *           example:
 *             bookingId: "64f207a8b9c0d1e2f3a4b5c7"
 *             rating: 5
 *             comment: "Excellent grooming service, my dog looked amazing!"
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
 *             example:
 *               success: true
 *               message: Review submitted
 *               data:
 *                 id: "64fa1b2c3d4e5f6a7b8c9d0e"
 *                 bookingId: "64f207a8b9c0d1e2f3a4b5c7"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 providerId: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                 rating: 5
 *                 comment: "Excellent grooming service, my dog looked amazing!"
 *                 createdAt: "2026-08-04T08:45:00.000Z"
 *       400:
 *         description: Invalid review payload, or booking not eligible for review
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
 */
reviewRoutes.post(
  '/',
  authenticate,
  validate({ body: createReviewSchema }),
  reviewController.create,
);
