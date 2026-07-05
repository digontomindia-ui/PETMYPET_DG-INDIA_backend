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
 *     responses:
 *       200: { description: Webhook processed }
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
 *       - { name: bookingId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Order created }
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
 *       - { name: bookingId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Refund processed }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Payment marked as cash collected }
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
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: List of payments }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Payment details }
 */
paymentRoutes.get(
  '/:id',
  authenticate,
  validate({ params: paymentIdParamSchema }),
  paymentController.getById,
);
