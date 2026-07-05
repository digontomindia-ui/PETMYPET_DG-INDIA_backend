import type { HydratedDocument, Types } from 'mongoose';
import type { NotificationType } from './notification.constants.js';

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;
