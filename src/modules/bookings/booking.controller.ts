import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import type { AuthenticatedUser } from '../../common/types/express.js';
import { bookingService } from './booking.service.js';
import type {
  AddBookingPhotoInput,
  CancelBookingInput,
  CreateBookingInput,
  UpdateProviderNotesInput,
  VerifyOtpInput,
} from './booking.dto.js';

function requireAuth(req: Request): AuthenticatedUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const bookingController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await bookingService.create(userId, req.body as CreateBookingInput);
    sendSuccess(res, HTTP_STATUS.CREATED, booking, 'Booking created');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const booking = await bookingService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, booking);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { bookings, total, page, limit } = await bookingService.listMine(userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, bookings, 'Success', buildPaginationMeta(page, limit, total));
  }),

  listForProvider: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { bookings, total, page, limit } = await bookingService.listForProvider(
      userId,
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, bookings, 'Success', buildPaginationMeta(page, limit, total));
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await bookingService.accept(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Booking accepted');
  }),

  startJourney: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await bookingService.startJourney(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Marked as on the way');
  }),

  verifyStartOtp: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { code } = req.body as VerifyOtpInput;
    const booking = await bookingService.verifyStartOtp(req.params.id as string, userId, code);
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Service started');
  }),

  verifyEndOtp: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { code } = req.body as VerifyOtpInput;
    const booking = await bookingService.verifyEndOtp(req.params.id as string, userId, code);
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Service completed');
  }),

  updateNotes: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await bookingService.updateProviderNotes(
      req.params.id as string,
      userId,
      req.body as UpdateProviderNotesInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Notes updated');
  }),

  addPhoto: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const booking = await bookingService.addPhoto(
      req.params.id as string,
      userId,
      req.body as AddBookingPhotoInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, booking, 'Photo added');
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const booking = await bookingService.cancel(
      req.params.id as string,
      userId,
      role,
      req.body as CancelBookingInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, booking, 'Booking cancelled');
  }),
};
