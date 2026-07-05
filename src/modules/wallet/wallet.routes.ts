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

walletRoutes.get('/me', walletController.getMyBalance);
walletRoutes.get(
  '/me/transactions',
  validate({ query: listTransactionsQuerySchema }),
  walletController.listMyTransactions,
);

walletRoutes.post(
  '/admin/:userId/adjust',
  requireRole(ROLES.SUPER_ADMIN),
  validate({ params: userIdParamSchema, body: adminAdjustWalletSchema }),
  walletController.adminAdjust,
);
