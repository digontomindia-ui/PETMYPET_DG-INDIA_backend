import type { HydratedDocument, Types } from 'mongoose';
import type { WalletTransactionReason, WalletTransactionType } from './wallet.constants.js';

export interface IWallet {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WalletDocument = HydratedDocument<IWallet>;

export interface IWalletTransaction {
  _id: Types.ObjectId;
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: WalletTransactionType;
  reason: WalletTransactionReason;
  amount: number;
  balanceAfter: number;
  referenceId: Types.ObjectId | null;
  description: string;
  createdAt: Date;
}

export type WalletTransactionDocument = HydratedDocument<IWalletTransaction>;
