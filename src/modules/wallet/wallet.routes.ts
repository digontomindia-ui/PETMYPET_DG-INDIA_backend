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
 *       200: { description: Wallet balance }
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
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: Wallet transactions listed }
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
 *       - { name: userId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Wallet adjusted }
 */
walletRoutes.post(
  '/admin/:userId/adjust',
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema, body: adminAdjustWalletSchema }),
  walletController.adminAdjust,
);
