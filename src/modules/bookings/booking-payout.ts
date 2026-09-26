import { logger } from '../../common/utils/logger.js';
import { PaymentModel } from '../payments/payment.schema.js';
import { PAYMENT_METHODS } from '../payments/payment.constants.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { walletService } from '../wallet/wallet.service.js';
import { WALLET_TRANSACTION_REASONS } from '../wallet/wallet.constants.js';
import { BookingModel } from './booking.schema.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from './booking.constants.js';
import type { BookingDocument } from './booking.types.js';

/**
 * Credits the provider's wallet with a booking's `providerPayoutAmount` once the booking is both
 * COMPLETED and paid online (Razorpay/wallet). Cash bookings are skipped — the provider already
 * holds that money. Called from every place either condition can become true (completion, payment
 * capture), so order doesn't matter; the `payoutCreditedAt: null` claim makes it idempotent.
 */
export async function creditProviderPayoutIfDue(bookingId: string): Promise<void> {
  const booking = await BookingModel.findById(bookingId).select(
    'status paymentStatus paymentId providerId providerPayoutAmount payoutCreditedAt',
  );
  if (
    !booking ||
    booking.status !== BOOKING_STATUSES.COMPLETED ||
    booking.paymentStatus !== PAYMENT_STATUSES.PAID ||
    booking.payoutCreditedAt ||
    booking.providerPayoutAmount <= 0
  ) {
    return;
  }

  const payment = booking.paymentId
    ? await PaymentModel.findById(booking.paymentId).select('method').lean()
    : null;
  if (!payment || payment.method === PAYMENT_METHODS.CASH) return;

  const provider = await ProviderModel.findById(booking.providerId).select('userId').lean();
  if (!provider) return;

  const claimed = await BookingModel.updateOne(
    { _id: booking._id, payoutCreditedAt: null },
    { payoutCreditedAt: new Date() },
  );
  if (claimed.modifiedCount === 0) return; // another request credited it first

  await walletService.credit(
    provider.userId.toString(),
    booking.providerPayoutAmount,
    WALLET_TRANSACTION_REASONS.BOOKING_PAYOUT,
    booking._id.toString(),
    'Service earnings',
  );
}

/** On refund of an already-credited booking, takes the payout back out of the provider's wallet.
 * ponytail: if the provider already withdrew it, the debit fails and is logged for manual
 * recovery rather than blocking the customer's refund — add a negative-balance ledger if this
 * starts happening often. */
export async function reverseProviderPayout(booking: BookingDocument): Promise<void> {
  if (!booking.payoutCreditedAt || booking.providerPayoutAmount <= 0) return;
  const provider = await ProviderModel.findById(booking.providerId).select('userId').lean();
  if (!provider) return;
  try {
    await walletService.debit(
      provider.userId.toString(),
      booking.providerPayoutAmount,
      WALLET_TRANSACTION_REASONS.BOOKING_PAYOUT_REVERSAL,
      booking._id.toString(),
      'Earnings reversed (booking refunded)',
    );
  } catch (err) {
    logger.warn(
      { err, bookingId: booking._id.toString(), amount: booking.providerPayoutAmount },
      'Could not reverse provider payout on refund — recover manually',
    );
  }
}
