import type { NotificationDocument } from './notification.types.js';

export function toNotificationDto(notification: NotificationDocument) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}
