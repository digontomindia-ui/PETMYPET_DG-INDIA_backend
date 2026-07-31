import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { WalletModel, WalletTransactionModel } from './wallet.schema.js';
import { WALLET_TRANSACTION_TYPES } from './wallet.constants.js';
import type { WalletTransactionReason } from './wallet.constants.js';
import type { WalletDocument } from './wallet.types.js';

export const walletRepository = {
  async findByUserId(userId: string): Promise<WalletDocument | null> {
    return WalletModel.findOne({ userId }).exec();
  },

  async getOrCreate(userId: string): Promise<WalletDocument> {
    const existing = await WalletModel.findOne({ userId }).exec();
    if (existing) return existing;

    try {
      return await WalletModel.create({ userId, balance: 0 });
    } catch (err) {
      // Two concurrent first-time credits could both miss the findOne above; the unique index
      // on userId then rejects the loser here, so fetch the winner's wallet instead of failing.
      if (isDuplicateKeyError(err)) {
        const wallet = await WalletModel.findOne({ userId }).exec();
        if (wallet) return wallet;
      }
      throw err;
    }
  },

  /**
   * Applies a credit/debit and appends the matching ledger entry.
   * ponytail: this deployment's MongoDB is a standalone instance (no replica set), so
   * multi-document transactions aren't available. The balance update is atomic on its own
   * (single-document findOneAndUpdate); if the ledger entry insert then fails, we compensate
   * by reverting the balance instead of wrapping both in a transaction. Upgrade back to
   * session.withTransaction() if the deployment ever gains a replica set.
   */
  async applyTransaction(input: {
    userId: string;
    type: (typeof WALLET_TRANSACTION_TYPES)[keyof typeof WALLET_TRANSACTION_TYPES];
    reason: WalletTransactionReason;
    amount: number;
    referenceId?: string | null;
    description?: string;
  }): Promise<WalletDocument> {
    if (input.amount <= 0) throw AppError.badRequest('Transaction amount must be positive');

    const wallet = await this.getOrCreate(input.userId);
    const delta = input.type === WALLET_TRANSACTION_TYPES.CREDIT ? input.amount : -input.amount;

    const filter: Record<string, unknown> = { _id: wallet._id };
    if (input.type === WALLET_TRANSACTION_TYPES.DEBIT) {
      filter.balance = { $gte: input.amount };
    }

    const updatedWallet = await WalletModel.findOneAndUpdate(
      filter,
      { $inc: { balance: delta } },
      { new: true },
    );
    if (!updatedWallet) {
      throw AppError.badRequest('Insufficient wallet balance');
    }

    try {
      await WalletTransactionModel.create({
        walletId: wallet._id,
        userId: new Types.ObjectId(input.userId),
        type: input.type,
        reason: input.reason,
        amount: input.amount,
        balanceAfter: updatedWallet.balance,
        referenceId: input.referenceId ? new Types.ObjectId(input.referenceId) : null,
        description: input.description ?? '',
      });
    } catch (err) {
      await WalletModel.updateOne({ _id: wallet._id }, { $inc: { balance: -delta } }).exec();
      throw err;
    }

    return updatedWallet;
  },

  async listTransactions(walletId: string, skip: number, limit: number) {
    const filter = { walletId };
    const [items, total] = await Promise.all([
      WalletTransactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      WalletTransactionModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

interface MongoDuplicateKeyError {
  code: 11000;
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}
