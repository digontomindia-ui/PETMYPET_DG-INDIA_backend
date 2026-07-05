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
 *       - { name: providerId, in: query, required: true, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Reviews listed }
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
 *     responses:
 *       201: { description: Review created }
 */
reviewRoutes.post(
  '/',
  authenticate,
  validate({ body: createReviewSchema }),
  reviewController.create,
);
