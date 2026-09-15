import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { providerAppService } from './provider-app.service.js';
import type {
  PatientsQuery,
  ProviderAppAnalyticsQuery,
  ProviderVerifyOtpInput,
  SessionOtpInput,
  SigninSignupInput,
  UploadDocumentsInput,
  UploadTrainingProcessInput,
} from './provider-app.dto.js';

function requireAuth(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

function deviceInfoFrom(req: Request) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

export const providerAppController = {
  signinSignup: asyncHandler(async (req: Request, res: Response) => {
    await providerAppService.signinSignup(req.body as SigninSignupInput);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'OTP sent successfully' });
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const result = await providerAppService.verifyOtp(
      req.body as ProviderVerifyOtpInput,
      deviceInfoFrom(req),
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login or signup successful',
      isDocumentSubmited: result.isDocumentSubmited,
      isDocumentApproved: result.isDocumentApproved,
      token: result.token,
    });
  }),

  uploadDocuments: asyncHandler(async (req: Request, res: Response) => {
    await providerAppService.uploadDocuments(requireAuth(req), req.body as UploadDocumentsInput);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Documents submitted successfully' });
  }),

  getHome: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getHome(requireAuth(req));
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getMyAppointments: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getMyAppointments(
      requireAuth(req),
      req.query,
    );
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getAppointments: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getAppointments(
      requireAuth(req),
      req.query,
    );
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getTrainerDashboard: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getTrainerDashboard(
      requireAuth(req),
      req.query,
    );
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getAnalytics(
      requireAuth(req),
      req.query as unknown as ProviderAppAnalyticsQuery,
    );
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getProfile(requireAuth(req));
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getPatients: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getPatients(
      requireAuth(req),
      req.query as unknown as PatientsQuery,
    );
    res.status(HTTP_STATUS.OK).json(data);
  }),

  startSessionVerifyOtp: asyncHandler(async (req: Request, res: Response) => {
    await providerAppService.startSessionVerifyOtp(requireAuth(req), req.body as SessionOtpInput);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'OTP matched successfully' });
  }),

  resendSessionOtp: asyncHandler(async (req: Request, res: Response) => {
    await providerAppService.resendSessionOtp(requireAuth(req));
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'OTP sent successfully' });
  }),

  endSessionVerifyOtp: asyncHandler(async (req: Request, res: Response) => {
    await providerAppService.endSessionVerifyOtp(requireAuth(req), req.body as SessionOtpInput);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'OTP matched successfully' });
  }),

  getEndSessionSummary: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getEndSessionSummary(requireAuth(req));
    res.status(HTTP_STATUS.OK).json(data);
  }),

  uploadTrainingProcess: asyncHandler(async (req: Request, res: Response) => {
    await providerAppService.uploadTrainingProcess(
      requireAuth(req),
      req.body as UploadTrainingProcessInput,
    );
    res
      .status(HTTP_STATUS.CREATED)
      .json({ success: true, message: 'Training progress uploaded successfully' });
  }),

  getInbox: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getInbox(requireAuth(req), req.query);
    res.status(HTTP_STATUS.OK).json(data);
  }),

  getRoomHistory: asyncHandler(async (req: Request, res: Response) => {
    const data = await providerAppService.getRoomHistory(
      requireAuth(req),
      req.params.room_id as string,
      req.query,
    );
    res.status(HTTP_STATUS.OK).json(data);
  }),
};
