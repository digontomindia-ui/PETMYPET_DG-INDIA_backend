import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { notificationController } from './notification.controller.js';
import { idParamSchema, listNotificationsQuerySchema } from './notification.validators.js';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the authenticated user's in-app notifications
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, schema: { type: string }, example: "20" }
 *       - { name: unreadOnly, in: query, schema: { type: string }, example: "true" }
 *     responses:
 *       200:
 *         description: Notifications listed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 notifications:
 *                   - id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                     type: BOOKING_ACCEPTED
 *                     title: Booking accepted
 *                     body: Happy Paws Grooming accepted your booking for Aug 6, 10:00 AM
 *                     data: { bookingId: "64f1a2b3c4d5e6f7a8b9c0e2" }
 *                     isRead: false
 *                     createdAt: "2026-08-04T06:15:00.000Z"
 *                   - id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                     type: PAYMENT_RECEIVED
 *                     title: Payment received
 *                     body: We received your payment of INR 799 for order #PMP10234
 *                     data: { orderId: "64f1a2b3c4d5e6f7a8b9c0e3", amount: 799 }
 *                     isRead: true
 *                     createdAt: "2026-08-03T14:02:00.000Z"
 *                 unreadCount: 1
 *               meta: { page: 1, limit: 20, total: 2, totalPages: 1 }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 */
notificationRoutes.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  notificationController.listMine,
);
/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all of the authenticated user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notifications marked read
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: All notifications marked as read
 *               data: null
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 */
notificationRoutes.patch('/read-all', notificationController.markAllRead);
/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0f1" }
 *     responses:
 *       200:
 *         description: Notification marked read
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Notification marked as read
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 type: BOOKING_ACCEPTED
 *                 title: Booking accepted
 *                 body: Happy Paws Grooming accepted your booking for Aug 6, 10:00 AM
 *                 data: { bookingId: "64f1a2b3c4d5e6f7a8b9c0e2" }
 *                 isRead: true
 *                 createdAt: "2026-08-04T06:15:00.000Z"
 *       400:
 *         description: Invalid notification id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Notification not found
 */
notificationRoutes.patch(
  '/:id/read',
  validate({ params: idParamSchema }),
  notificationController.markRead,
);
/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0f1" }
 *     responses:
 *       200:
 *         description: Notification deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Notification deleted
 *               data: null
 *       400:
 *         description: Invalid notification id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Notification not found
 */
notificationRoutes.delete(
  '/:id',
  validate({ params: idParamSchema }),
  notificationController.remove,
);
