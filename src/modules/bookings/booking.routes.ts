import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { bookingController } from './booking.controller.js';
import {
  cancelBookingSchema,
  createBookingSchema,
  idParamSchema,
  listBookingsQuerySchema,
  verifyOtpSchema,
} from './booking.validators.js';

const requireProvider = [authenticate, requireRole(ROLES.SERVICE_PROVIDER)] as const;

export const bookingRoutes = Router();

bookingRoutes.use(authenticate);

bookingRoutes.post(
  '/',
  requireRole(ROLES.USER),
  validate({ body: createBookingSchema }),
  bookingController.create,
);

bookingRoutes.get('/me', validate({ query: listBookingsQuerySchema }), bookingController.listMine);
bookingRoutes.get(
  '/provider/me',
  ...requireProvider,
  validate({ query: listBookingsQuerySchema }),
  bookingController.listForProvider,
);

bookingRoutes.get('/:id', validate({ params: idParamSchema }), bookingController.getById);

bookingRoutes.patch(
  '/:id/accept',
  ...requireProvider,
  validate({ params: idParamSchema }),
  bookingController.accept,
);
bookingRoutes.patch(
  '/:id/on-the-way',
  ...requireProvider,
  validate({ params: idParamSchema }),
  bookingController.startJourney,
);
bookingRoutes.post(
  '/:id/otp/start',
  ...requireProvider,
  validate({ params: idParamSchema, body: verifyOtpSchema }),
  bookingController.verifyStartOtp,
);
bookingRoutes.post(
  '/:id/otp/end',
  ...requireProvider,
  validate({ params: idParamSchema, body: verifyOtpSchema }),
  bookingController.verifyEndOtp,
);

bookingRoutes.patch(
  '/:id/cancel',
  validate({ params: idParamSchema, body: cancelBookingSchema }),
  bookingController.cancel,
);
