import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { lostAndFoundService } from './lost-and-found.service.js';
import type { CreateLostAndFoundInput, RejectLostAndFoundInput } from './lost-and-found.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const lostAndFoundController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const post = await lostAndFoundService.create(userId, req.body as CreateLostAndFoundInput);
    sendSuccess(res, HTTP_STATUS.CREATED, post, 'Post submitted for approval');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { posts, total, page, limit } = await lostAndFoundService.list(req.query);
    sendSuccess(res, HTTP_STATUS.OK, posts, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const post = await lostAndFoundService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, post);
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const post = await lostAndFoundService.resolve(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, post, 'Marked as resolved');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    await lostAndFoundService.remove(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Post deleted');
  }),

  listPending: asyncHandler(async (req: Request, res: Response) => {
    const { posts, total, page, limit } = await lostAndFoundService.listPending(req.query);
    sendSuccess(res, HTTP_STATUS.OK, posts, 'Success', buildPaginationMeta(page, limit, total));
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const post = await lostAndFoundService.approve(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, post, 'Post approved');
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const post = await lostAndFoundService.reject(
      req.params.id as string,
      req.body as RejectLostAndFoundInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, post, 'Post rejected');
  }),
};
