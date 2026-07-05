import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { couponService } from './coupon.service.js';
import type { CreateCouponInput, UpdateCouponInput, ValidateCouponInput } from './coupon.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const couponController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.create(req.body as CreateCouponInput);
    sendSuccess(res, HTTP_STATUS.CREATED, coupon, 'Coupon created');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { coupons, total, page, limit } = await couponService.list(req.query);
    sendSuccess(res, HTTP_STATUS.OK, coupons, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, coupon);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.update(
      req.params.id as string,
      req.body as UpdateCouponInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, coupon, 'Coupon updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await couponService.remove(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Coupon deleted');
  }),

  validate: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req);
    const { code, bookingAmount, providerType } = req.body as ValidateCouponInput;
    const result = await couponService.validate(code, userId, bookingAmount, providerType);
    sendSuccess(res, HTTP_STATUS.OK, result);
  }),
};
