import type { WalletDocument, WalletTransactionDocument } from './wallet.types.js';

export function toWalletDto(wallet: WalletDocument) {
  return {
    id: wallet._id.toString(),
    userId: wallet.userId.toString(),
    balance: wallet.balance,
    currency: wallet.currency,
  };
}

export function toWalletTransactionDto(transaction: WalletTransactionDocument) {
  return {
    id: transaction._id.toString(),
    type: transaction.type,
    reason: transaction.reason,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    referenceId: transaction.referenceId ? transaction.referenceId.toString() : null,
    description: transaction.description,
    createdAt: transaction.createdAt,
  };
}
