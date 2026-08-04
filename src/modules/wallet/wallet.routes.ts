import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { walletController } from './wallet.controller.js';
import {
  adminAdjustWalletSchema,
  listTransactionsQuerySchema,
  userIdParamSchema,
} from './wallet.validators.js';

export const walletRoutes = Router();

walletRoutes.use(authenticate);

/**
 * @openapi
 * /wallet/me:
 *   get:
 *     tags: [Wallet]
 *     summary: Get the authenticated user's wallet balance
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 balance: 1250.5
 *                 currency: INR
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
walletRoutes.get('/me', walletController.getMyBalance);
/**
 * @openapi
 * /wallet/me/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: List the authenticated user's wallet transactions
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, schema: { type: string }, example: "20" }
 *     responses:
 *       200:
 *         description: Wallet transactions listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f2"
 *                   type: CREDIT
 *                   reason: BOOKING_REFUND
 *                   amount: 500
 *                   balanceAfter: 1250.5
 *                   referenceId: "64f1a2b3c4d5e6f7a8b9c0a1"
 *                   description: Refund for cancelled grooming booking
 *                   createdAt: "2024-06-18T11:00:00.000Z"
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f3"
 *                   type: DEBIT
 *                   reason: ORDER_PAYMENT
 *                   amount: 750
 *                   balanceAfter: 750.5
 *                   referenceId: "64f1a2b3c4d5e6f7a8b9c0a2"
 *                   description: Payment for pet food order #ORD-1042
 *                   createdAt: "2024-06-15T09:30:00.000Z"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 2
 *                 totalPages: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "limit: Invalid input"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
walletRoutes.get(
  '/me/transactions',
  validate({ query: listTransactionsQuerySchema }),
  walletController.listMyTransactions,
);

/**
 * @openapi
 * /wallet/admin/{userId}/adjust:
 *   post:
 *     tags: [Wallet]
 *     summary: Manually credit or debit a user's wallet (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: userId, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, description]
 *             properties:
 *               type: { type: string, enum: [CREDIT, DEBIT] }
 *               amount: { type: number, minimum: 0, exclusiveMinimum: true }
 *               description: { type: string, maxLength: 500 }
 *           example:
 *             type: CREDIT
 *             amount: 200
 *             description: Goodwill credit for delayed pickup
 *     responses:
 *       200:
 *         description: Wallet adjusted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Wallet adjusted
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 balance: 1450.5
 *                 currency: INR
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "amount: Number must be greater than 0"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
walletRoutes.post(
  '/admin/:userId/adjust',
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema, body: adminAdjustWalletSchema }),
  walletController.adminAdjust,
);
