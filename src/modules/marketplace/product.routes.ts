import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  idParamSchema,
  searchProductsQuerySchema,
  updateProductSchema,
} from './product.validators.js';

const canManage = [authenticate, requireRole(ROLES.SUPER_ADMIN, ROLES.SERVICE_PROVIDER)] as const;

export const productRoutes = Router();

productRoutes.get('/', validate({ query: searchProductsQuerySchema }), productController.search);
productRoutes.get('/:id', validate({ params: idParamSchema }), productController.getById);

productRoutes.post(
  '/',
  ...canManage,
  validate({ body: createProductSchema }),
  productController.create,
);
productRoutes.put(
  '/:id',
  ...canManage,
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update,
);
productRoutes.delete(
  '/:id',
  ...canManage,
  validate({ params: idParamSchema }),
  productController.remove,
);
