export const PAYMENT_MODEL_NAME = 'Payment';

export const PAYMENT_METHODS = {
  RAZORPAY: 'RAZORPAY',
  WALLET: 'WALLET',
  CASH: 'CASH',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_TRANSACTION_STATUSES = {
  CREATED: 'CREATED',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export type PaymentTransactionStatus =
  (typeof PAYMENT_TRANSACTION_STATUSES)[keyof typeof PAYMENT_TRANSACTION_STATUSES];

export const PAYMENT_PURPOSES = {
  BOOKING: 'BOOKING',
  ORDER: 'ORDER',
  WALLET_TOPUP: 'WALLET_TOPUP',
} as const;

export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[keyof typeof PAYMENT_PURPOSES];
