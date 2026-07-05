import { BaseRepository } from '../../common/repositories/base.repository.js';
import { NotificationModel } from './notification.schema.js';
import type { INotification } from './notification.types.js';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }

  async countUnread(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isRead: false }).exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.model.updateMany({ userId, isRead: false }, { isRead: true }).exec();
  }
}

export const notificationRepository = new NotificationRepository();
