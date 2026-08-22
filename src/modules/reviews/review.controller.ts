import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { reviewService } from './review.service.js';
import type { CreateReviewInput } from './review.dto.js';

export const reviewController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviewService.create(req.user.userId, req.body as CreateReviewInput);
    sendSuccess(res, HTTP_STATUS.CREATED, review, 'Review submitted');
  }),

  listForProvider: asyncHandler(async (req: Request, res: Response) => {
    const { reviews, total, page, limit } = await reviewService.listForProvider(
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, reviews, 'Success', buildPaginationMeta(page, limit, total));
  }),
};
