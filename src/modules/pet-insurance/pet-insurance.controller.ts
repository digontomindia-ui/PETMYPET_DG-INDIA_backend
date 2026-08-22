import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { petInsuranceService } from './pet-insurance.service.js';
import type {
  CreateInsuranceApplicationInput,
  UpdateApplicationStatusInput,
} from './pet-insurance.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const petInsuranceController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const application = await petInsuranceService.create(
      userId,
      req.body as CreateInsuranceApplicationInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, application, 'Insurance application submitted');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { applications, total, page, limit } = await petInsuranceService.listMine(
      userId,
      req.query,
    );
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      applications,
      'Success',
      buildPaginationMeta(page, limit, total),
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const application = await petInsuranceService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, application);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { applications, total, page, limit } = await petInsuranceService.list(req.query);
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      applications,
      'Success',
      buildPaginationMeta(page, limit, total),
    );
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const application = await petInsuranceService.updateStatus(
      req.params.id as string,
      req.body as UpdateApplicationStatusInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, application, 'Application status updated');
  }),
};
