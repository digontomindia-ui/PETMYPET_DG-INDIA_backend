import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { serviceController } from './service.controller.js';
import {
  createServiceSchema,
  idParamSchema,
  searchServicesQuerySchema,
  updateServiceSchema,
} from './service.validators.js';

const requireProvider = [authenticate, requireRole(ROLES.SERVICE_PROVIDER)] as const;

export const serviceRoutes = Router();

serviceRoutes.get('/', validate({ query: searchServicesQuerySchema }), serviceController.search);
serviceRoutes.get('/:id', validate({ params: idParamSchema }), serviceController.getById);

serviceRoutes.post(
  '/',
  ...requireProvider,
  validate({ body: createServiceSchema }),
  serviceController.create,
);
serviceRoutes.put(
  '/:id',
  ...requireProvider,
  validate({ params: idParamSchema, body: updateServiceSchema }),
  serviceController.update,
);
serviceRoutes.delete(
  '/:id',
  ...requireProvider,
  validate({ params: idParamSchema }),
  serviceController.remove,
);
