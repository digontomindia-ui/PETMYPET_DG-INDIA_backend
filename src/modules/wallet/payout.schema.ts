import { model, Schema, type HydratedDocument, type Types } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PROVIDER_MODEL_NAME } from '../providers/provider.constants.js';

export const PAYOUT_STATUSES = {
  /** Wallet already debited; waiting for an admin to transfer the money. */
  REQUESTED: 'REQUESTED',
  PAID: 'PAID',
  /** Admin rejected; the amount was credited back to the wallet. */
  REJECTED: 'REJECTED',
} as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[keyof typeof PAYOUT_STATUSES];

export const MIN_WITHDRAWAL_AMOUNT = 100;

export interface IPayoutRequest {
  _id: Types.ObjectId;
  providerId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PayoutStatus;
  /** Snapshot at request time — later bank edits don't redirect an in-flight payout. */
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType: string;
  };
  referenceNumber: string | null;
  adminNote: string;
  processedBy: Types.ObjectId | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PayoutRequestDocument = HydratedDocument<IPayoutRequest>;

const payoutRequestSchema = new Schema<IPayoutRequest>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, required: true },
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    amount: { type: Number, required: true, min: MIN_WITHDRAWAL_AMOUNT },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PAYOUT_STATUSES),
      default: PAYOUT_STATUSES.REQUESTED,
    },
    bankAccount: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
      accountType: { type: String, default: 'SAVINGS' },
    },
    referenceNumber: { type: String, default: null },
    adminNote: { type: String, default: '' },
    processedBy: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

payoutRequestSchema.index({ userId: 1, createdAt: -1 });
payoutRequestSchema.index({ status: 1, createdAt: 1 });

export const PayoutRequestModel = model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);

/** Masks the account number everywhere a payout leaves the server. */
export function toPayoutDto(payout: IPayoutRequest) {
  return {
    id: payout._id.toString(),
    providerId: payout.providerId.toString(),
    userId: payout.userId.toString(),
    amount: payout.amount,
    currency: payout.currency,
    status: payout.status,
    bankAccount: {
      accountHolderName: payout.bankAccount.accountHolderName,
      bankName: payout.bankAccount.bankName,
      ifscCode: payout.bankAccount.ifscCode,
      accountType: payout.bankAccount.accountType,
      last4: payout.bankAccount.accountNumber.slice(-4),
    },
    referenceNumber: payout.referenceNumber,
    adminNote: payout.adminNote,
    processedAt: payout.processedAt,
    createdAt: payout.createdAt,
  };
}
