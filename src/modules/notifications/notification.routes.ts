import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { notificationController } from './notification.controller.js';
import { idParamSchema, listNotificationsQuerySchema } from './notification.validators.js';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  notificationController.listMine,
);
notificationRoutes.patch('/read-all', notificationController.markAllRead);
notificationRoutes.patch(
  '/:id/read',
  validate({ params: idParamSchema }),
  notificationController.markRead,
);
notificationRoutes.delete(
  '/:id',
  validate({ params: idParamSchema }),
  notificationController.remove,
);
