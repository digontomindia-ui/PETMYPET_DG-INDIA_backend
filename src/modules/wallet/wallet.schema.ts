import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  WALLET_MODEL_NAME,
  WALLET_TRANSACTION_MODEL_NAME,
  WALLET_TRANSACTION_REASONS,
  WALLET_TRANSACTION_TYPES,
} from './wallet.constants.js';
import type { IWallet, IWalletTransaction } from './wallet.types.js';

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
  },
  { timestamps: true },
);

export const WalletModel = model<IWallet>(WALLET_MODEL_NAME, walletSchema);

const walletTransactionSchema = new Schema<IWalletTransaction>({
  walletId: { type: Schema.Types.ObjectId, ref: WALLET_MODEL_NAME, required: true },
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  type: { type: String, enum: Object.values(WALLET_TRANSACTION_TYPES), required: true },
  reason: { type: String, enum: Object.values(WALLET_TRANSACTION_REASONS), required: true },
  amount: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true, min: 0 },
  referenceId: { type: Schema.Types.ObjectId, default: null },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: () => new Date() },
});

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

export const WalletTransactionModel = model<IWalletTransaction>(
  WALLET_TRANSACTION_MODEL_NAME,
  walletTransactionSchema,
);
