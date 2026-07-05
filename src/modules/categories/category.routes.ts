import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { categoryController } from './category.controller.js';
import {
  createCategorySchema,
  idParamSchema,
  updateCategorySchema,
} from './category.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const categoryRoutes = Router();

categoryRoutes.get('/', categoryController.list);
categoryRoutes.get('/:id', validate({ params: idParamSchema }), categoryController.getById);
categoryRoutes.post(
  '/',
  ...adminOnly,
  validate({ body: createCategorySchema }),
  categoryController.create,
);
categoryRoutes.put(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateCategorySchema }),
  categoryController.update,
);
categoryRoutes.delete(
  '/:id',
  ...adminOnly,
  validate({ params: idParamSchema }),
  categoryController.remove,
);
