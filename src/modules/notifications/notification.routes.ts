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
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Notifications listed }
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
 *       200: { description: Notifications marked read }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Notification marked read }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Notification deleted }
 */
notificationRoutes.delete(
  '/:id',
  validate({ params: idParamSchema }),
  notificationController.remove,
);
