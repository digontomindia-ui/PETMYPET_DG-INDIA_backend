import type { PaymentDocument } from './payment.types.js';

export function toPaymentDto(payment: PaymentDocument) {
  return {
    id: payment._id.toString(),
    bookingId: payment.bookingId.toString(),
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    razorpayOrderId: payment.razorpayOrderId,
    refundedAmount: payment.refundedAmount,
    failureReason: payment.failureReason,
    createdAt: payment.createdAt,
  };
}
