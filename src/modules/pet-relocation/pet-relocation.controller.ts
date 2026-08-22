import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { petRelocationService } from './pet-relocation.service.js';
import type {
  CreateRelocationRequestInput,
  UpdateRelocationStatusInput,
} from './pet-relocation.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const petRelocationController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const request = await petRelocationService.create(
      userId,
      req.body as CreateRelocationRequestInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, request, 'Relocation request submitted');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { requests, total, page, limit } = await petRelocationService.listMine(
      userId,
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, requests, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const request = await petRelocationService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, request);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { requests, total, page, limit } = await petRelocationService.list(req.query);
    sendSuccess(res, HTTP_STATUS.OK, requests, 'Success', buildPaginationMeta(page, limit, total));
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const request = await petRelocationService.updateStatus(
      req.params.id as string,
      req.body as UpdateRelocationStatusInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, request, 'Relocation request updated');
  }),
};
