import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { walletService } from './wallet.service.js';
import type { AdminAdjustWalletInput } from './wallet.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const walletController = {
  getMyBalance: asyncHandler(async (req: Request, res: Response) => {
    const wallet = await walletService.getBalance(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, wallet);
  }),

  listMyTransactions: asyncHandler(async (req: Request, res: Response) => {
    const { transactions, total, page, limit } = await walletService.listTransactions(
      requireAuth(req),
      req.query,
    );
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      transactions,
      'Success',
      buildPaginationMeta(page, limit, total),
    );
  }),

  adminAdjust: asyncHandler(async (req: Request, res: Response) => {
    const wallet = await walletService.adminAdjust(
      req.params.userId as string,
      req.body as AdminAdjustWalletInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, wallet, 'Wallet adjusted');
  }),
};
