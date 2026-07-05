import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { orderService } from './order.service.js';
import type { PlaceOrderInput, UpdateOrderStatusInput } from './order.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const orderController = {
  placeOrder: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const order = await orderService.placeOrder(userId, req.body as PlaceOrderInput);
    sendSuccess(res, HTTP_STATUS.CREATED, order, 'Order placed');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { orders, total, page, limit } = await orderService.listMine(userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, orders, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const order = await orderService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, order);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const order = await orderService.updateStatus(
      userId,
      req.params.id as string,
      req.body as UpdateOrderStatusInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, order, 'Order status updated');
  }),

  markCodPaid: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.markCodPaid(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, order, 'Order marked as paid');
  }),
};
