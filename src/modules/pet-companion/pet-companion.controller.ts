import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { petCompanionService } from './pet-companion.service.js';
import type { DiscoverQuery, PetIdQuery, SwipeInput } from './pet-companion.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const petCompanionController = {
  discover: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const { pets, total, page, limit } = await petCompanionService.discover(
      userId,
      role,
      req.query as unknown as DiscoverQuery,
    );
    sendSuccess(res, HTTP_STATUS.OK, pets, 'Success', buildPaginationMeta(page, limit, total));
  }),

  swipe: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const result = await petCompanionService.swipe(userId, role, req.body as SwipeInput);
    sendSuccess(res, HTTP_STATUS.OK, result, result.matched ? "It's a match!" : 'Swipe recorded');
  }),

  likesReceived: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const { pets, total, page, limit } = await petCompanionService.likesReceived(
      userId,
      role,
      req.query as unknown as PetIdQuery,
    );
    sendSuccess(res, HTTP_STATUS.OK, pets, 'Success', buildPaginationMeta(page, limit, total));
  }),

  matches: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const { matches, total, page, limit } = await petCompanionService.matches(
      userId,
      role,
      req.query as unknown as PetIdQuery,
    );
    sendSuccess(res, HTTP_STATUS.OK, matches, 'Success', buildPaginationMeta(page, limit, total));
  }),
};
