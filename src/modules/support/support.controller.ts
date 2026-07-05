import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { supportService } from './support.service.js';
import type { AddMessageInput, CreateTicketInput, UpdateTicketStatusInput } from './support.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const supportController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const ticket = await supportService.create(userId, req.body as CreateTicketInput);
    sendSuccess(res, HTTP_STATUS.CREATED, ticket, 'Support ticket created');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { tickets, total, page, limit } = await supportService.listMine(userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, tickets, 'Success', buildPaginationMeta(page, limit, total));
  }),

  listAll: asyncHandler(async (req: Request, res: Response) => {
    const { tickets, total, page, limit } = await supportService.listAll(req.query);
    sendSuccess(res, HTTP_STATUS.OK, tickets, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getWithMessages: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const result = await supportService.getWithMessages(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, result);
  }),

  addMessage: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const message = await supportService.addMessage(
      req.params.id as string,
      userId,
      role,
      req.body as AddMessageInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, message, 'Message added');
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const ticket = await supportService.updateStatus(
      req.params.id as string,
      req.body as UpdateTicketStatusInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, ticket, 'Ticket status updated');
  }),
};
