import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { BOOKING_MODEL_NAME } from '../bookings/booking.constants.js';
import {
  PAYMENT_METHODS,
  PAYMENT_MODEL_NAME,
  PAYMENT_TRANSACTION_STATUSES,
} from './payment.constants.js';
import type { IPayment } from './payment.types.js';

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: BOOKING_MODEL_NAME, required: true },
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_TRANSACTION_STATUSES),
      default: PAYMENT_TRANSACTION_STATUSES.CREATED,
    },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },
    refundedAmount: { type: Number, default: 0, min: 0 },
    failureReason: { type: String, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ bookingId: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

export const PaymentModel = model<IPayment>(PAYMENT_MODEL_NAME, paymentSchema);
