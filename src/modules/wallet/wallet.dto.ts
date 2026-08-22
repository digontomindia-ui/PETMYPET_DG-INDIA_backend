import type { z } from 'zod';
import type {
  adminAdjustWalletSchema,
  listTransactionsQuerySchema,
  topupWalletSchema,
} from './wallet.validators.js';

export type AdminAdjustWalletInput = z.infer<typeof adminAdjustWalletSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type TopupWalletInput = z.infer<typeof topupWalletSchema>;

export interface WalletTopupResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}
