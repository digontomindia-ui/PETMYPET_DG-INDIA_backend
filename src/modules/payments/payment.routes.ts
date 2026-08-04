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
/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay webhook - receives payment event notifications (called by Razorpay's servers, not user-authenticated)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Razorpay event payload; signature is verified via the X-Razorpay-Signature header
 *             properties:
 *               event: { type: string }
 *               payload:
 *                 type: object
 *                 properties:
 *                   payment:
 *                     type: object
 *                     properties:
 *                       entity:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           order_id: { type: string }
 *           example:
 *             event: payment.captured
 *             payload:
 *               payment:
 *                 entity:
 *                   id: pay_NXtZ9xyzDEF456
 *                   order_id: order_NXtZ4xyzABC123
 *     responses:
 *       200:
 *         description: Webhook processed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *       400:
 *         description: Missing or malformed raw request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Missing raw request body
 *       401:
 *         description: Missing or invalid webhook signature
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Invalid webhook signature
 */
paymentRoutes.post('/webhook', paymentController.webhook);

/**
 * @openapi
 * /payments/bookings/{bookingId}/order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment order for a booking (USER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: bookingId, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method]
 *             properties:
 *               method: { type: string, enum: [RAZORPAY, WALLET, CASH] }
 *           example:
 *             method: RAZORPAY
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Payment initiated
 *               data:
 *                 paymentId: 64f1a2b3c4d5e6f7a8b9c0e1
 *                 razorpayOrderId: order_NXtZ4xyzABC123
 *                 amount: 899
 *                 currency: INR
 *                 razorpayKeyId: rzp_test_1234567890abcd
 *       400:
 *         description: Validation error, or the booking is cancelled/already paid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Cannot pay for a cancelled booking
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
paymentRoutes.post(
  '/bookings/:bookingId/order',
  authenticate,
  requireRole(ROLES.USER),
  validate({ params: bookingIdParamSchema, body: createOrderSchema }),
  paymentController.createOrder,
);

/**
 * @openapi
 * /payments/bookings/{bookingId}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund a booking's payment (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: bookingId, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Refund processed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Booking refunded
 *               data:
 *                 _id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                 bookingId: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 amount: 899
 *                 currency: INR
 *                 method: RAZORPAY
 *                 status: REFUNDED
 *                 razorpayOrderId: order_NXtZ4xyzABC123
 *                 razorpayPaymentId: pay_NXtZ9xyzDEF456
 *                 refundedAmount: 899
 *                 failureReason: null
 *                 createdAt: '2026-08-04T06:35:00.000Z'
 *                 updatedAt: '2026-08-04T07:10:00.000Z'
 *       400:
 *         description: Validation error, or no captured payment exists to refund
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: This booking has no captured payment to refund
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
paymentRoutes.post(
  '/bookings/:bookingId/refund',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: bookingIdParamSchema }),
  paymentController.refundBooking,
);

/**
 * @openapi
 * /payments/{id}/mark-cash-collected:
 *   patch:
 *     tags: [Payments]
 *     summary: Mark a cash payment as collected (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0e1 }
 *     responses:
 *       200:
 *         description: Payment marked as cash collected
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Cash payment marked as collected
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                 bookingId: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 amount: 899
 *                 currency: INR
 *                 method: CASH
 *                 status: CAPTURED
 *                 razorpayOrderId: null
 *                 refundedAmount: 0
 *                 failureReason: null
 *                 createdAt: '2026-08-04T06:35:00.000Z'
 *       400:
 *         description: Validation error, or this payment is not a cash payment
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: This payment is not a cash payment
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
paymentRoutes.patch(
  '/:id/mark-cash-collected',
  authenticate,
  requireRole(ROLES.SERVICE_PROVIDER),
  validate({ params: paymentIdParamSchema }),
  paymentController.markCashCollected,
);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: List all payments (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, required: false, schema: { type: string }, example: '1' }
 *       - { name: limit, in: query, required: false, schema: { type: string }, example: '20' }
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   bookingId: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   amount: 899
 *                   currency: INR
 *                   method: RAZORPAY
 *                   status: CAPTURED
 *                   razorpayOrderId: order_NXtZ4xyzABC123
 *                   refundedAmount: 0
 *                   failureReason: null
 *                   createdAt: '2026-08-04T06:35:00.000Z'
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
 *               message: 'Invalid limit'
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
paymentRoutes.get(
  '/',
  authenticate,
  requireRole(ROLES.SUPER_ADMIN),
  validate({ query: listPaymentsQuerySchema }),
  paymentController.listAll,
);

/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get a payment by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: 64f1a2b3c4d5e6f7a8b9c0e1 }
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                 bookingId: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 amount: 899
 *                 currency: INR
 *                 method: RAZORPAY
 *                 status: CAPTURED
 *                 razorpayOrderId: order_NXtZ4xyzABC123
 *                 refundedAmount: 0
 *                 failureReason: null
 *                 createdAt: '2026-08-04T06:35:00.000Z'
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
paymentRoutes.get(
  '/:id',
  authenticate,
  validate({ params: paymentIdParamSchema }),
  paymentController.getById,
);
