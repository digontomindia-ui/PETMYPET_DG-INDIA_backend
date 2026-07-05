import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { notificationService } from './notification.service.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const notificationController = {
  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { notifications, total, page, limit, unreadCount } = await notificationService.listMine(
      requireAuth(req),
      req.query,
    );
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      { notifications, unreadCount },
      'Success',
      buildPaginationMeta(page, limit, total),
    );
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markRead(
      req.params.id as string,
      requireAuth(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, notification, 'Notification marked as read');
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, null, 'All notifications marked as read');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.remove(req.params.id as string, requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, null, 'Notification deleted');
  }),
};
