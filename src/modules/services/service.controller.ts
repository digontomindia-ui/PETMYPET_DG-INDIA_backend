import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { ROLES } from '../../common/constants/roles.js';
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
    // A provider browsing (their app's "My Services" screen) sees only their OWN services; everyone
    // else — customers, anonymous — browses every provider's services.
    if (req.user?.role === ROLES.SERVICE_PROVIDER) {
      const { services } = await serviceService.listMine(req.user.userId);
      sendSuccess(res, HTTP_STATUS.OK, services);
      return;
    }
    const { services, total, page, limit } = await serviceService.search(req.query);
    sendSuccess(res, HTTP_STATUS.OK, services, 'Success', buildPaginationMeta(page, limit, total));
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { services } = await serviceService.listMine(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, services);
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
