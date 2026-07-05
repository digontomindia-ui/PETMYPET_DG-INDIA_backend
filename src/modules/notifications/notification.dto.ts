import type { z } from 'zod';
import type { listNotificationsQuerySchema } from './notification.validators.js';
import type { NotificationType } from './notification.constants.js';

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export interface PushNotificationJobData {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export interface SmsJobData {
  to: string;
  message: string;
}

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}
