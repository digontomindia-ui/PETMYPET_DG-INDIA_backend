import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { paymentController } from './payment.controller.js';
import {
  bookingIdParamSchema,
  createOrderSchema,
  listPaymentsQuerySchema,
  paymentIdParamSchema,
} from './payment.validators.js';

export const paymentRoutes = Router();

// Public: verified via Razorpay's HMAC signature, not a user session.
paymentRoutes.post('/webhook', paymentController.webhook);

paymentRoutes.post(
  '/bookings/:bookingId/order',
  authenticate,
  requireRole(ROLES.USER),
  validate({ params: bookingIdParamSchema, body: createOrderSchema }),
  paymentController.createOrder,
);

paymentRoutes.post(
  '/bookings/:bookingId/refund',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: bookingIdParamSchema }),
  paymentController.refundBooking,
);

paymentRoutes.patch(
  '/:id/mark-cash-collected',
  authenticate,
  requireRole(ROLES.SERVICE_PROVIDER),
  validate({ params: paymentIdParamSchema }),
  paymentController.markCashCollected,
);

paymentRoutes.get(
  '/',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ query: listPaymentsQuerySchema }),
  paymentController.listAll,
);

paymentRoutes.get(
  '/:id',
  authenticate,
  validate({ params: paymentIdParamSchema }),
  paymentController.getById,
);
