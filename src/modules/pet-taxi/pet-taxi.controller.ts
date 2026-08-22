import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { petTaxiService } from './pet-taxi.service.js';
import type { CancelPetTaxiBookingInput, CreatePetTaxiBookingInput } from './pet-taxi.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const petTaxiController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await petTaxiService.create(userId, req.body as CreatePetTaxiBookingInput);
    sendSuccess(res, HTTP_STATUS.CREATED, booking, 'Pet taxi booking created');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { bookings, total, page, limit } = await petTaxiService.listMine(userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, bookings, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const booking = await petTaxiService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, booking);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await petTaxiService.cancel(
      req.params.id as string,
      userId,
      req.body as CancelPetTaxiBookingInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Booking cancelled');
  }),
};
