export const ORDER_MODEL_NAME = 'Order';

/** Flat delivery fee applied to every marketplace order (rupees). */
export const DEFAULT_DELIVERY_FEE = 40;

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  CONFIRMED: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
  SHIPPED: [ORDER_STATUSES.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

export const ORDER_PAYMENT_METHODS = {
  WALLET: 'WALLET',
  CASH_ON_DELIVERY: 'CASH_ON_DELIVERY',
  RAZORPAY: 'RAZORPAY',
} as const;

export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[keyof typeof ORDER_PAYMENT_METHODS];

export const ORDER_PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type OrderPaymentStatus =
  (typeof ORDER_PAYMENT_STATUSES)[keyof typeof ORDER_PAYMENT_STATUSES];
