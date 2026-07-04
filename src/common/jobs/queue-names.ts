export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  SMS: 'sms-queue',
  PUSH_NOTIFICATION: 'push-notification-queue',
  INVOICE: 'invoice-queue',
  ANALYTICS: 'analytics-queue',
  REMINDER: 'reminder-queue',
  BOOKING: 'booking-queue',
  PAYMENT: 'payment-queue',
  CLEANUP: 'cleanup-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
