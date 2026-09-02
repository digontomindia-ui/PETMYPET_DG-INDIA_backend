import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { paymentService } from './payment.service.js';
import type { CreateOrderInput, VerifyPaymentInput } from './payment.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const paymentController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { method } = req.body as CreateOrderInput;
    const result = await paymentService.createOrder(req.params.bookingId as string, userId, method);
    sendSuccess(res, HTTP_STATUS.CREATED, result, 'Payment initiated');
  }),

  verifyPayment: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const payment = await paymentService.verifyPayment(
      req.params.id as string,
      userId,
      req.body as VerifyPaymentInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, payment, 'Payment verified');
  }),

  markCashCollected: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const payment = await paymentService.markCashCollected(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.OK, payment, 'Cash payment marked as collected');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const payment = await paymentService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, payment);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { payments, total, page, limit } = await paymentService.listMine(userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, payments, 'Success', buildPaginationMeta(page, limit, total));
  }),

  listAll: asyncHandler(async (req: Request, res: Response) => {
    const { payments, total, page, limit } = await paymentService.listAll(req.query);
    sendSuccess(res, HTTP_STATUS.OK, payments, 'Success', buildPaginationMeta(page, limit, total));
  }),

  refundBooking: asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.refundBooking(req.params.bookingId as string);
    sendSuccess(res, HTTP_STATUS.OK, payment, 'Booking refunded');
  }),

  webhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'];
    if (typeof signature !== 'string') throw AppError.unauthorized('Missing webhook signature');

    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw AppError.badRequest('Missing raw request body');

    await paymentService.handleWebhook(rawBody.toString('utf8'), signature);
    res.status(HTTP_STATUS.OK).json({ success: true });
  }),
};
