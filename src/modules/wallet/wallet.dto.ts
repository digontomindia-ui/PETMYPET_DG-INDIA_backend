import type { z } from 'zod';
import type { adminAdjustWalletSchema, listTransactionsQuerySchema } from './wallet.validators.js';

export type AdminAdjustWalletInput = z.infer<typeof adminAdjustWalletSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
