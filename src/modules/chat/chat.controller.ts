import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { chatService } from './chat.service.js';
import type { CreateRoomInput, SendMessageInput, UpdateUrgentInput } from './chat.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const chatController = {
  createRoom: asyncHandler(async (req: Request, res: Response) => {
    const room = await chatService.createOrGetRoom(requireAuth(req), req.body as CreateRoomInput);
    sendSuccess(res, HTTP_STATUS.CREATED, room);
  }),

  listRooms: asyncHandler(async (req: Request, res: Response) => {
    const { rooms, total, page, limit } = await chatService.listRooms(requireAuth(req), req.query);
    sendSuccess(res, HTTP_STATUS.OK, rooms, 'Success', buildPaginationMeta(page, limit, total));
  }),

  listMessages: asyncHandler(async (req: Request, res: Response) => {
    const messages = await chatService.listMessages(
      req.params.roomId as string,
      requireAuth(req),
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, messages);
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const message = await chatService.sendMessage(
      req.params.roomId as string,
      requireAuth(req),
      req.body as SendMessageInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, message);
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await chatService.markRead(req.params.roomId as string, requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, null, 'Room marked as read');
  }),

  setUrgent: asyncHandler(async (req: Request, res: Response) => {
    const room = await chatService.setUrgent(
      req.params.roomId as string,
      requireAuth(req),
      req.body as UpdateUrgentInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, room, 'Room updated');
  }),
};
