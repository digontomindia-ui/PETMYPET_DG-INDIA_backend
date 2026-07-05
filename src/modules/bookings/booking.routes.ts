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

/**
 * @openapi
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking (user only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Booking created }
 */
bookingRoutes.post(
  '/',
  requireRole(ROLES.USER),
  validate({ body: createBookingSchema }),
  bookingController.create,
);

/**
 * @openapi
 * /bookings/me:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings for the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: status, in: query, required: false, schema: { type: string } }
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: List of bookings for the current user }
 */
bookingRoutes.get('/me', validate({ query: listBookingsQuerySchema }), bookingController.listMine);
/**
 * @openapi
 * /bookings/provider/me:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings for the current service provider (service provider only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: status, in: query, required: false, schema: { type: string } }
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: List of bookings for the current service provider }
 */
bookingRoutes.get(
  '/provider/me',
  ...requireProvider,
  validate({ query: listBookingsQuerySchema }),
  bookingController.listForProvider,
);

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get a booking by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Booking details }
 */
bookingRoutes.get('/:id', validate({ params: idParamSchema }), bookingController.getById);

/**
 * @openapi
 * /bookings/{id}/accept:
 *   patch:
 *     tags: [Bookings]
 *     summary: Accept a booking (service provider only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Booking accepted }
 */
bookingRoutes.patch(
  '/:id/accept',
  ...requireProvider,
  validate({ params: idParamSchema }),
  bookingController.accept,
);
/**
 * @openapi
 * /bookings/{id}/on-the-way:
 *   patch:
 *     tags: [Bookings]
 *     summary: Mark the provider as on the way for a booking (service provider only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Booking marked as on the way }
 */
bookingRoutes.patch(
  '/:id/on-the-way',
  ...requireProvider,
  validate({ params: idParamSchema }),
  bookingController.startJourney,
);
/**
 * @openapi
 * /bookings/{id}/otp/start:
 *   post:
 *     tags: [Bookings]
 *     summary: Start a booking by verifying the start OTP (service provider only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Booking started }
 */
bookingRoutes.post(
  '/:id/otp/start',
  ...requireProvider,
  validate({ params: idParamSchema, body: verifyOtpSchema }),
  bookingController.verifyStartOtp,
);
/**
 * @openapi
 * /bookings/{id}/otp/end:
 *   post:
 *     tags: [Bookings]
 *     summary: End a booking by verifying the end OTP (service provider only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Booking ended }
 */
bookingRoutes.post(
  '/:id/otp/end',
  ...requireProvider,
  validate({ params: idParamSchema, body: verifyOtpSchema }),
  bookingController.verifyEndOtp,
);

/**
 * @openapi
 * /bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Booking cancelled }
 */
bookingRoutes.patch(
  '/:id/cancel',
  validate({ params: idParamSchema, body: cancelBookingSchema }),
  bookingController.cancel,
);
