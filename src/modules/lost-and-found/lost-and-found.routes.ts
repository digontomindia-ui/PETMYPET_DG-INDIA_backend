import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { lostAndFoundController } from './lost-and-found.controller.js';
import {
  createLostAndFoundSchema,
  idParamSchema,
  listLostAndFoundQuerySchema,
  listPendingQuerySchema,
  rejectLostAndFoundSchema,
} from './lost-and-found.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const lostAndFoundRoutes = Router();

lostAndFoundRoutes.get(
  '/',
  validate({ query: listLostAndFoundQuerySchema }),
  lostAndFoundController.list,
);

lostAndFoundRoutes.get(
  '/pending',
  ...adminOnly,
  validate({ query: listPendingQuerySchema }),
  lostAndFoundController.listPending,
);

lostAndFoundRoutes.get('/:id', validate({ params: idParamSchema }), lostAndFoundController.getById);
lostAndFoundRoutes.post(
  '/',
  authenticate,
  validate({ body: createLostAndFoundSchema }),
  lostAndFoundController.create,
);
lostAndFoundRoutes.patch(
  '/:id/resolve',
  authenticate,
  validate({ params: idParamSchema }),
  lostAndFoundController.resolve,
);
lostAndFoundRoutes.delete(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  lostAndFoundController.remove,
);

lostAndFoundRoutes.patch(
  '/:id/approve',
  ...adminOnly,
  validate({ params: idParamSchema }),
  lostAndFoundController.approve,
);
lostAndFoundRoutes.patch(
  '/:id/reject',
  ...adminOnly,
  validate({ params: idParamSchema, body: rejectLostAndFoundSchema }),
  lostAndFoundController.reject,
);
