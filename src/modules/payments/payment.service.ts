import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { logger } from '../../common/utils/logger.js';
import { env } from '../../common/config/env.js';
import { getRazorpayClient, verifyWebhookSignature } from '../../common/integrations/razorpay.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { bookingRepository } from '../bookings/booking.repository.js';
import { bookingService } from '../bookings/booking.service.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../bookings/booking.constants.js';
import { walletService } from '../wallet/wallet.service.js';
import { WALLET_TRANSACTION_REASONS } from '../wallet/wallet.constants.js';
import { providerRepository } from '../providers/provider.repository.js';
import { paymentRepository } from './payment.repository.js';
import { toPaymentDto } from './payment.mapper.js';
import { PAYMENT_METHODS, PAYMENT_TRANSACTION_STATUSES } from './payment.constants.js';
import type { RazorpayOrderResponse } from './payment.dto.js';
import type { PaymentDocument } from './payment.types.js';

function netAmount(price: number, discountAmount: number): number {
  return Math.max(0, Math.round((price - discountAmount) * 100) / 100);
}

async function requireOwnBooking(bookingId: string, userId: string) {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.userId.toString() !== userId) {
    throw AppError.forbidden('This booking does not belong to you');
  }
  return booking;
}

export const paymentService = {
  async createOrder(
    bookingId: string,
    userId: string,
    method: (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS],
  ): Promise<RazorpayOrderResponse | { payment: ReturnType<typeof toPaymentDto> }> {
    const booking = await requireOwnBooking(bookingId, userId);
    if (booking.paymentStatus === PAYMENT_STATUSES.PAID) {
      throw AppError.conflict('This booking has already been paid for');
    }
    if (
      booking.status === BOOKING_STATUSES.CANCELLED ||
      booking.status === BOOKING_STATUSES.REFUNDED
    ) {
      throw AppError.badRequest('Cannot pay for a cancelled booking');
    }

    const amount = netAmount(booking.price, booking.discountAmount);

    if (method === PAYMENT_METHODS.WALLET) {
      const payment = await paymentRepository.create({
        bookingId: booking._id,
        userId: booking.userId,
        amount,
        currency: booking.currency,
        method,
        status: PAYMENT_TRANSACTION_STATUSES.CREATED,
      });

      await walletService.debit(
        userId,
        amount,
        WALLET_TRANSACTION_REASONS.BOOKING_PAYMENT,
        bookingId,
        'Booking payment',
      );

      payment.status = PAYMENT_TRANSACTION_STATUSES.CAPTURED;
      await payment.save();
      await bookingRepository.updateById(bookingId, {
        paymentStatus: PAYMENT_STATUSES.PAID,
        paymentId: payment._id,
      });

      return { payment: toPaymentDto(payment) };
    }

    if (method === PAYMENT_METHODS.CASH) {
      const payment = await paymentRepository.create({
        bookingId: booking._id,
        userId: booking.userId,
        amount,
        currency: booking.currency,
        method,
        status: PAYMENT_TRANSACTION_STATUSES.CREATED,
      });
      return { payment: toPaymentDto(payment) };
    }

    const razorpayOrder = await getRazorpayClient().orders.create({
      amount: Math.round(amount * 100),
      currency: booking.currency,
      receipt: bookingId,
      notes: { bookingId },
    });

    const payment = await paymentRepository.create({
      bookingId: booking._id,
      userId: booking.userId,
      amount,
      currency: booking.currency,
      method,
      status: PAYMENT_TRANSACTION_STATUSES.CREATED,
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      paymentId: payment._id.toString(),
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: booking.currency,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    };
  },

  async markCashCollected(paymentId: string, providerUserId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw AppError.notFound('Payment not found');
    if (payment.method !== PAYMENT_METHODS.CASH)
      throw AppError.badRequest('This payment is not a cash payment');

    const provider = await providerRepository.findByUserId(providerUserId);
    const booking = await bookingRepository.findById(payment.bookingId.toString());
    if (!provider || !booking || booking.providerId.toString() !== provider._id.toString()) {
      throw AppError.forbidden('This payment does not belong to your provider account');
    }

    payment.status = PAYMENT_TRANSACTION_STATUSES.CAPTURED;
    await payment.save();
    await bookingRepository.updateById(payment.bookingId.toString(), {
      paymentStatus: PAYMENT_STATUSES.PAID,
      paymentId: payment._id,
    });

    return toPaymentDto(payment);
  },

  async getById(paymentId: string, userId: string, role: Role) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw AppError.notFound('Payment not found');
    if (role !== ROLES.SUPER_ADMIN && payment.userId.toString() !== userId) {
      throw AppError.forbidden('This payment does not belong to you');
    }
    return toPaymentDto(payment);
  },

  async listAll(query: { page?: string; limit?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      paymentRepository.findMany({}, { skip, limit, sort: { createdAt: -1 } }),
      paymentRepository.count({}),
    ]);
    return { payments: items.map(toPaymentDto), total, page, limit };
  },

  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    if (!verifyWebhookSignature(rawBody, signature)) {
      throw AppError.unauthorized('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment?: { entity: { id: string; order_id: string; error_description?: string } };
        refund?: { entity: { id: string; payment_id: string; amount: number; status: string } };
      };
    };

    logger.info({ event: event.event }, 'Razorpay webhook received');

    if (event.event === 'payment.captured' && event.payload.payment) {
      await this.onPaymentCaptured(
        event.payload.payment.entity.order_id,
        event.payload.payment.entity.id,
      );
    } else if (event.event === 'payment.failed' && event.payload.payment) {
      await this.onPaymentFailed(
        event.payload.payment.entity.order_id,
        event.payload.payment.entity.error_description ?? 'Payment failed',
      );
    }
  },

  async onPaymentCaptured(razorpayOrderId: string, razorpayPaymentId: string): Promise<void> {
    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!payment || payment.status === PAYMENT_TRANSACTION_STATUSES.CAPTURED) return; // idempotent

    payment.status = PAYMENT_TRANSACTION_STATUSES.CAPTURED;
    payment.razorpayPaymentId = razorpayPaymentId;
    await payment.save();

    await bookingRepository.updateById(payment.bookingId.toString(), {
      paymentStatus: PAYMENT_STATUSES.PAID,
      paymentId: payment._id,
    });
  },

  async onPaymentFailed(razorpayOrderId: string, reason: string): Promise<void> {
    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!payment) return;

    payment.status = PAYMENT_TRANSACTION_STATUSES.FAILED;
    payment.failureReason = reason;
    await payment.save();

    await bookingRepository.updateById(payment.bookingId.toString(), {
      paymentStatus: PAYMENT_STATUSES.FAILED,
    });
  },

  /** Admin-initiated refund: reverses the captured payment via its original method, then marks the booking refunded. */
  async refundBooking(bookingId: string): Promise<PaymentDocument> {
    const payment = await paymentRepository.findLatestForBooking(bookingId);
    if (!payment || payment.status !== PAYMENT_TRANSACTION_STATUSES.CAPTURED) {
      throw AppError.badRequest('This booking has no captured payment to refund');
    }

    if (payment.method === PAYMENT_METHODS.RAZORPAY) {
      if (!payment.razorpayPaymentId) throw AppError.internal('Missing gateway payment reference');
      await getRazorpayClient().payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(payment.amount * 100),
      });
    } else {
      await walletService.credit(
        payment.userId.toString(),
        payment.amount,
        WALLET_TRANSACTION_REASONS.BOOKING_REFUND,
        bookingId,
        'Booking refund',
      );
    }

    payment.status = PAYMENT_TRANSACTION_STATUSES.REFUNDED;
    payment.refundedAmount = payment.amount;
    await payment.save();

    await bookingService.markRefunded(bookingId);

    return payment;
  },
};
