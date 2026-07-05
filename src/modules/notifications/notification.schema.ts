import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { NOTIFICATION_MODEL_NAME, NOTIFICATION_TYPES } from './notification.constants.js';
import type { INotification } from './notification.types.js';

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() },
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = model<INotification>(NOTIFICATION_MODEL_NAME, notificationSchema);
