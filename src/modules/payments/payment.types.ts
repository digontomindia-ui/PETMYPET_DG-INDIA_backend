import type { HydratedDocument, Types } from 'mongoose';
import type { PaymentMethod, PaymentPurpose, PaymentTransactionStatus } from './payment.constants.js';

export interface IPayment {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId | null;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: PaymentPurpose;
  status: PaymentTransactionStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  refundedAmount: number;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<IPayment>;
