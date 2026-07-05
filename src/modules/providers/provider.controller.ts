import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { providerService } from './provider.service.js';
import type {
  CreateProviderProfileInput,
  NearbyProvidersQuery,
  RejectKycInput,
  SetBankAccountInput,
  UpdateProviderProfileInput,
  UploadKycDocumentInput,
} from './provider.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const providerController = {
  createProfile: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.createProfile(
      requireAuth(req),
      req.body as CreateProviderProfileInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, provider, 'Provider profile created');
  }),

  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.getMyProfile(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, provider);
  }),

  updateMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.updateMyProfile(
      requireAuth(req),
      req.body as UpdateProviderProfileInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Provider profile updated');
  }),

  setActive: asyncHandler(async (req: Request, res: Response) => {
    const isActive = (req.body as { isActive: boolean }).isActive;
    const provider = await providerService.setActive(requireAuth(req), isActive);
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Availability updated');
  }),

  uploadKycDocument: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.uploadKycDocument(
      requireAuth(req),
      req.body as UploadKycDocumentInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, provider, 'KYC document uploaded');
  }),

  removeKycDocument: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.removeKycDocument(
      requireAuth(req),
      req.params.documentId as string,
    );
    sendSuccess(res, HTTP_STATUS.OK, provider, 'KYC document removed');
  }),

  setBankAccount: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.setBankAccount(
      requireAuth(req),
      req.body as SetBankAccountInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Bank account updated');
  }),

  checkIn: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.checkIn(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Checked in');
  }),

  checkOut: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.checkOut(requireAuth(req));
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Checked out');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, provider);
  }),

  listNearby: asyncHandler(async (req: Request, res: Response) => {
    const { providers, page, limit } = await providerService.listNearby(
      req.query as NearbyProvidersQuery,
    );
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      providers,
      'Success',
      buildPaginationMeta(page, limit, providers.length),
    );
  }),

  listPendingKyc: asyncHandler(async (req: Request, res: Response) => {
    const { providers, total, page, limit } = await providerService.listPendingKyc(req.query);
    sendSuccess(res, HTTP_STATUS.OK, providers, 'Success', buildPaginationMeta(page, limit, total));
  }),

  approveKyc: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.approveKyc(requireAuth(req), req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Provider KYC approved');
  }),

  rejectKyc: asyncHandler(async (req: Request, res: Response) => {
    const provider = await providerService.rejectKyc(
      requireAuth(req),
      req.params.id as string,
      req.body as RejectKycInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, provider, 'Provider KYC rejected');
  }),
};
