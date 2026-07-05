import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { reviewController } from './review.controller.js';
import { createReviewSchema, listReviewsQuerySchema } from './review.validators.js';

export const reviewRoutes = Router();

reviewRoutes.get(
  '/',
  validate({ query: listReviewsQuerySchema }),
  reviewController.listForProvider,
);
reviewRoutes.post(
  '/',
  authenticate,
  validate({ body: createReviewSchema }),
  reviewController.create,
);
