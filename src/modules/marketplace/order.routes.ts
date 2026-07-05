import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { orderController } from './order.controller.js';
import {
  idParamSchema,
  listOrdersQuerySchema,
  placeOrderSchema,
  updateOrderStatusSchema,
} from './order.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const orderRoutes = Router();

orderRoutes.use(authenticate);

orderRoutes.post('/', validate({ body: placeOrderSchema }), orderController.placeOrder);
orderRoutes.get('/', validate({ query: listOrdersQuerySchema }), orderController.listMine);
orderRoutes.get('/:id', validate({ params: idParamSchema }), orderController.getById);

orderRoutes.patch(
  '/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);
orderRoutes.patch(
  '/:id/mark-cod-paid',
  ...adminOnly,
  validate({ params: idParamSchema }),
  orderController.markCodPaid,
);
