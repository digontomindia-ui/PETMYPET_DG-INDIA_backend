import { z } from 'zod';

export const adminAdjustWalletSchema = z.object({
  type: z.enum(['CREDIT', 'DEBIT']),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
});

export const listTransactionsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id'),
});
