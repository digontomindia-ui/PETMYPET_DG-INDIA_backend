import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { getQueue } from '../../common/jobs/queue.factory.js';
import { QUEUE_NAMES } from '../../common/jobs/queue-names.js';
import { logger } from '../../common/utils/logger.js';
import { notificationRepository } from './notification.repository.js';
import { toNotificationDto } from './notification.mapper.js';
import type {
  EmailJobData,
  ListNotificationsQuery,
  NotifyInput,
  PushNotificationJobData,
  SmsJobData,
} from './notification.dto.js';

// Enqueues without awaiting the broker round-trip: callers on the request path (booking
// creation, payment capture, etc.) must never block, or hang, on notification delivery being
// best-effort and Redis being merely reachable-most-of-the-time.

export const notificationService = {
  /** Records an in-app notification and enqueues a best-effort push notification for it. */
  async notify(input: NotifyInput) {
    const notification = await notificationRepository.create({
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    });

    getQueue<PushNotificationJobData>(QUEUE_NAMES.PUSH_NOTIFICATION)
      .add('send', {
        notificationId: notification._id.toString(),
        userId: input.userId,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
      })
      .catch((err: unknown) => logger.error({ err }, 'Failed to enqueue push notification job'));

    return toNotificationDto(notification);
  },

  queueEmail(to: string, subject: string, html: string): void {
    getQueue<EmailJobData>(QUEUE_NAMES.EMAIL)
      .add('send', { to, subject, html })
      .catch((err: unknown) => logger.error({ err }, 'Failed to enqueue email job'));
  },

  queueSms(to: string, message: string): void {
    getQueue<SmsJobData>(QUEUE_NAMES.SMS)
      .add('send', { to, message })
      .catch((err: unknown) => logger.error({ err }, 'Failed to enqueue sms job'));
  },

  async listMine(userId: string, query: ListNotificationsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { userId };
    if (query.unreadOnly === 'true') filter.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      notificationRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      notificationRepository.count(filter),
      notificationRepository.countUnread(userId),
    ]);

    return { notifications: items.map(toNotificationDto), total, page, limit, unreadCount };
  },

  async markRead(notificationId: string, userId: string) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification || notification.userId.toString() !== userId) {
      throw AppError.notFound('Notification not found');
    }
    notification.isRead = true;
    await notification.save();
    return toNotificationDto(notification);
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },

  async remove(notificationId: string, userId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification || notification.userId.toString() !== userId) {
      throw AppError.notFound('Notification not found');
    }
    await notificationRepository.deleteById(notificationId);
  },
};
