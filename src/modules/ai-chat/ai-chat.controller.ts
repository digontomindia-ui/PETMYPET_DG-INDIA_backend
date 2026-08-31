import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { aiChatService } from './ai-chat.service.js';
import type { SendAiChatMessageInput } from './ai-chat.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const aiChatController = {
  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiChatService.sendMessage(
      requireAuth(req),
      req.body as SendAiChatMessageInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, result);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { messages, total, page, limit } = await aiChatService.listMine(
      requireAuth(req),
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, messages, 'Success', buildPaginationMeta(page, limit, total));
  }),
};
