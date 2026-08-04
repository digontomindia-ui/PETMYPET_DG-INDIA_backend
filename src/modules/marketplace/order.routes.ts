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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress, paymentMethod]
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required: [addressLine1, city, state, postalCode]
 *                 properties:
 *                   addressLine1: { type: string, maxLength: 200 }
 *                   addressLine2: { type: string, maxLength: 200 }
 *                   city: { type: string, maxLength: 100 }
 *                   state: { type: string, maxLength: 100 }
 *                   postalCode: { type: string, maxLength: 20 }
 *                   country: { type: string, maxLength: 100, default: India }
 *               paymentMethod: { type: string, enum: [WALLET, CASH_ON_DELIVERY] }
 *           example:
 *             shippingAddress:
 *               addressLine1: "221B Baker Street"
 *               addressLine2: "Near HSR Layout"
 *               city: Bengaluru
 *               state: Karnataka
 *               postalCode: "560102"
 *               country: India
 *             paymentMethod: WALLET
 *     responses:
 *       201:
 *         description: Order placed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Order placed, data: { id: "64f1a2b3c4d5e6f7a8b9c0f9", userId: "64f1a2b3c4d5e6f7a8b9c0d2", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, quantity: 2 }], totalAmount: 2998, currency: INR, shippingAddress: { addressLine1: "221B Baker Street", addressLine2: "Near HSR Layout", city: Bengaluru, state: Karnataka, postalCode: "560102", country: India }, status: PENDING, paymentMethod: WALLET, paymentStatus: PAID, createdAt: "2026-08-04T12:00:00.000Z" } }
 *       400:
 *         description: Validation error, empty cart, or insufficient wallet balance
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Insufficient wallet balance" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
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
 *       - name: page
 *         in: query
 *         schema: { type: string, default: "1" }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string, default: "20" }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f9"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, quantity: 2 }]
 *                   totalAmount: 2998
 *                   currency: INR
 *                   shippingAddress: { addressLine1: "221B Baker Street", city: Bengaluru, state: Karnataka, postalCode: "560102", country: India }
 *                   status: PENDING
 *                   paymentMethod: WALLET
 *                   paymentStatus: PAID
 *                   createdAt: "2026-08-04T12:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f9"
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Success, data: { id: "64f1a2b3c4d5e6f7a8b9c0f9", userId: "64f1a2b3c4d5e6f7a8b9c0d2", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, quantity: 2 }], totalAmount: 2998, currency: INR, shippingAddress: { addressLine1: "221B Baker Street", city: Bengaluru, state: Karnataka, postalCode: "560102", country: India }, status: PENDING, paymentMethod: WALLET, paymentStatus: PAID, createdAt: "2026-08-04T12:00:00.000Z" } }
 *       400:
 *         description: Invalid id parameter or order not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Order not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f9"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [CONFIRMED, SHIPPED, DELIVERED, CANCELLED] }
 *           example:
 *             status: SHIPPED
 *     responses:
 *       200:
 *         description: Order status updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Order status updated, data: { id: "64f1a2b3c4d5e6f7a8b9c0f9", userId: "64f1a2b3c4d5e6f7a8b9c0d2", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, quantity: 2 }], totalAmount: 2998, currency: INR, shippingAddress: { addressLine1: "221B Baker Street", city: Bengaluru, state: Karnataka, postalCode: "560102", country: India }, status: SHIPPED, paymentMethod: WALLET, paymentStatus: PAID, createdAt: "2026-08-04T12:00:00.000Z" } }
 *       400:
 *         description: Validation error, order not found, or invalid status transition
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Order not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
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
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f9"
 *     responses:
 *       200:
 *         description: Order marked as paid
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example: { success: true, message: Order marked as paid, data: { id: "64f1a2b3c4d5e6f7a8b9c0f9", userId: "64f1a2b3c4d5e6f7a8b9c0d2", items: [{ productId: "64f1a2b3c4d5e6f7a8b9c0d1", name: "Royal Canin Adult Dog Food 3kg", price: 1499, quantity: 2 }], totalAmount: 2998, currency: INR, shippingAddress: { addressLine1: "221B Baker Street", city: Bengaluru, state: Karnataka, postalCode: "560102", country: India }, status: DELIVERED, paymentMethod: CASH_ON_DELIVERY, paymentStatus: PAID, createdAt: "2026-08-04T12:00:00.000Z" } }
 *       400:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Order not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
orderRoutes.patch(
  '/:id/mark-cod-paid',
  ...adminOnly,
  validate({ params: idParamSchema }),
  orderController.markCodPaid,
);
