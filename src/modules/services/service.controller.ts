import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { serviceService } from './service.service.js';
import type { CreateServiceInput, UpdateServiceInput } from './service.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const serviceController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const service = await serviceService.create(requireAuth(req), req.body as CreateServiceInput);
    sendSuccess(res, HTTP_STATUS.CREATED, service, 'Service created');
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const { services, total, page, limit } = await serviceService.search(req.query);
    sendSuccess(res, HTTP_STATUS.OK, services, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const service = await serviceService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, service);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const service = await serviceService.update(
      req.params.id as string,
      requireAuth(req),
      req.body as UpdateServiceInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, service, 'Service updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await serviceService.remove(req.params.id as string, requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, null, 'Service deleted');
  }),
};
