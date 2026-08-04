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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [providerId, serviceId, scheduledStart]
 *             properties:
 *               providerId: { type: string, description: Provider's ObjectId }
 *               serviceId: { type: string, description: Service's ObjectId }
 *               petId: { type: string, description: Optional pet ObjectId }
 *               scheduledStart: { type: string, format: date-time, description: Must be in the future }
 *               couponCode: { type: string }
 *               notes: { type: string, default: '' }
 *           example:
 *             providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *             serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *             petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *             scheduledStart: '2026-08-10T09:00:00.000Z'
 *             couponCode: WELCOME10
 *             notes: Please ring the doorbell twice
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Booking created
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: PENDING
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: null
 *                 cancellationReason: null
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *                 otpStart: null
 *                 otpEnd: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: 'scheduledStart must be in the future'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: status, in: query, required: false, schema: { type: string }, example: ACCEPTED }
 *       - { name: page, in: query, required: false, schema: { type: string }, example: '1' }
 *       - { name: limit, in: query, required: false, schema: { type: string }, example: '20' }
 *     responses:
 *       200:
 *         description: List of bookings for the current user
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                   providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                   serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                   zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                   scheduledStart: '2026-08-10T09:00:00.000Z'
 *                   scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                   status: ACCEPTED
 *                   price: 899
 *                   currency: INR
 *                   couponCode: WELCOME10
 *                   discountAmount: 90
 *                   paymentStatus: PENDING
 *                   cancelledBy: null
 *                   cancellationReason: null
 *                   notes: Please ring the doorbell twice
 *                   createdAt: '2026-08-04T06:30:00.000Z'
 *                   otpStart: '482913'
 *                   otpEnd: null
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 1
 *                 totalPages: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: 'Invalid status'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: status, in: query, required: false, schema: { type: string }, example: PENDING }
 *       - { name: page, in: query, required: false, schema: { type: string }, example: '1' }
 *       - { name: limit, in: query, required: false, schema: { type: string }, example: '20' }
 *     responses:
 *       200:
 *         description: List of bookings for the current service provider
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                   providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                   serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                   zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                   scheduledStart: '2026-08-10T09:00:00.000Z'
 *                   scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                   status: PENDING
 *                   price: 899
 *                   currency: INR
 *                   couponCode: WELCOME10
 *                   discountAmount: 90
 *                   paymentStatus: PENDING
 *                   cancelledBy: null
 *                   cancellationReason: null
 *                   notes: Please ring the doorbell twice
 *                   createdAt: '2026-08-04T06:30:00.000Z'
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 1
 *                 totalPages: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: 'Invalid status'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: ACCEPTED
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: null
 *                 cancellationReason: null
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *                 otpStart: '482913'
 *                 otpEnd: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Booking accepted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Booking accepted
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: ACCEPTED
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: null
 *                 cancellationReason: null
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Booking marked as on the way
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Marked as on the way
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: ON_THE_WAY
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: null
 *                 cancellationReason: null
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, minLength: 4, maxLength: 6 }
 *           example:
 *             code: '482913'
 *     responses:
 *       200:
 *         description: Booking started
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Service started
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: STARTED
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: null
 *                 cancellationReason: null
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *       400:
 *         description: Validation error or invalid OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid start OTP
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, minLength: 4, maxLength: 6 }
 *           example:
 *             code: '117042'
 *     responses:
 *       200:
 *         description: Booking ended
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Service completed
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: COMPLETED
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: null
 *                 cancellationReason: null
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *       400:
 *         description: Validation error or invalid OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid end OTP
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, minLength: 1, maxLength: 500 }
 *           example:
 *             reason: Change of plans, no longer needed
 *     responses:
 *       200:
 *         description: Booking cancelled
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Booking cancelled
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 petId: 64f1a2b3c4d5e6f7a8b9c0d3
 *                 providerId: 64f1a2b3c4d5e6f7a8b9c0d4
 *                 serviceId: 64f1a2b3c4d5e6f7a8b9c0d5
 *                 zoneId: 64f1a2b3c4d5e6f7a8b9c0d6
 *                 scheduledStart: '2026-08-10T09:00:00.000Z'
 *                 scheduledEnd: '2026-08-10T10:00:00.000Z'
 *                 status: CANCELLED
 *                 price: 899
 *                 currency: INR
 *                 couponCode: WELCOME10
 *                 discountAmount: 90
 *                 paymentStatus: PENDING
 *                 cancelledBy: USER
 *                 cancellationReason: Change of plans, no longer needed
 *                 notes: Please ring the doorbell twice
 *                 createdAt: '2026-08-04T06:30:00.000Z'
 *                 otpStart: null
 *                 otpEnd: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: 'Cannot move booking from COMPLETED to CANCELLED'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
bookingRoutes.patch(
  '/:id/cancel',
  validate({ params: idParamSchema, body: cancelBookingSchema }),
  bookingController.cancel,
);
