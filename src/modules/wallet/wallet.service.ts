import { parsePagination } from '../../common/utils/pagination.js';
import { auditLogService } from '../admin/admin.service.js';
import { AUDIT_ACTIONS } from '../admin/admin.constants.js';
import { walletRepository } from './wallet.repository.js';
import { toWalletDto, toWalletTransactionDto } from './wallet.mapper.js';
import { WALLET_TRANSACTION_REASONS, WALLET_TRANSACTION_TYPES } from './wallet.constants.js';
import type { AdminAdjustWalletInput, ListTransactionsQuery } from './wallet.dto.js';
import type { WalletTransactionReason } from './wallet.constants.js';

export const walletService = {
  async getBalance(userId: string) {
    const wallet = await walletRepository.getOrCreate(userId);
    return toWalletDto(wallet);
  },

  async listTransactions(userId: string, query: ListTransactionsQuery) {
    const wallet = await walletRepository.getOrCreate(userId);
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await walletRepository.listTransactions(
      wallet._id.toString(),
      skip,
      limit,
    );
    return { transactions: items.map(toWalletTransactionDto), total, page, limit };
  },

  /** Credits a user's wallet (e.g. booking refund, provider payout). Used across modules. */
  async credit(
    userId: string,
    amount: number,
    reason: WalletTransactionReason,
    referenceId?: string | null,
    description?: string,
  ) {
    const wallet = await walletRepository.applyTransaction({
      userId,
      type: WALLET_TRANSACTION_TYPES.CREDIT,
      reason,
      amount,
      referenceId,
      description,
    });
    return toWalletDto(wallet);
  },

  /** Debits a user's wallet (e.g. paying for a booking from wallet balance). Throws if insufficient funds. */
  async debit(
    userId: string,
    amount: number,
    reason: WalletTransactionReason,
    referenceId?: string | null,
    description?: string,
  ) {
    const wallet = await walletRepository.applyTransaction({
      userId,
      type: WALLET_TRANSACTION_TYPES.DEBIT,
      reason,
      amount,
      referenceId,
      description,
    });
    return toWalletDto(wallet);
  },

  async adminAdjust(actorId: string, userId: string, input: AdminAdjustWalletInput) {
    const wallet = await walletRepository.applyTransaction({
      userId,
      type: input.type,
      reason: WALLET_TRANSACTION_REASONS.ADMIN_ADJUSTMENT,
      amount: input.amount,
      description: input.description,
    });

    await auditLogService.record(actorId, AUDIT_ACTIONS.WALLET_ADJUSTED, 'Wallet', userId, {
      type: input.type,
      amount: input.amount,
    });

    return toWalletDto(wallet);
  },
};
