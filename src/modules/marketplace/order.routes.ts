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

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Order placed }
 */
orderRoutes.post('/', validate({ body: placeOrderSchema }), orderController.placeOrder);
/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders for the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: List of orders }
 */
orderRoutes.get('/', validate({ query: listOrdersQuerySchema }), orderController.listMine);
/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Order details }
 */
orderRoutes.get('/:id', validate({ params: idParamSchema }), orderController.getById);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Order status updated }
 */
orderRoutes.patch(
  '/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);
/**
 * @openapi
 * /orders/{id}/mark-cod-paid:
 *   patch:
 *     tags: [Orders]
 *     summary: Mark a cash-on-delivery order as paid (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Order marked as paid }
 */
orderRoutes.patch(
  '/:id/mark-cod-paid',
  ...adminOnly,
  validate({ params: idParamSchema }),
  orderController.markCodPaid,
);
