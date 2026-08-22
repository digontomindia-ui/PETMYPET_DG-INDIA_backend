import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { referralService } from './referral.service.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const referralController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const summary = await referralService.getMe(userId);
    sendSuccess(res, HTTP_STATUS.OK, summary);
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { referrals, total, page, limit } = await referralService.getHistory(
      userId,
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, referrals, 'Success', buildPaginationMeta(page, limit, total));
  }),

  redeem: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const result = await referralService.redeem(userId);
    sendSuccess(res, HTTP_STATUS.OK, result, 'Reward points redeemed to wallet');
  }),
};
