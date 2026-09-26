import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { providerAppService } from './provider-app.service.js';
import { providerAppAccountService as account } from './provider-app.account.service.js';
import type {
  BankAccountInput,
  EarningsQuery,
  ExperienceSkillsInput,
  PersonalInfoInput,
  ProviderDocumentInput,
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

  getReviews: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.getReviews(requireAuth(req), req.query));
  }),

  replyToReview: asyncHandler(async (req: Request, res: Response) => {
    const { reply } = req.body as { reply: string };
    res
      .status(HTTP_STATUS.OK)
      .json(await account.replyToReview(requireAuth(req), req.params.review_id as string, reply));
  }),

  getEarnings: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.getEarnings(requireAuth(req), req.query as unknown as EarningsQuery));
  }),

  withdraw: asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body as { amount: number };
    res.status(HTTP_STATUS.CREATED).json(await account.withdraw(requireAuth(req), amount));
  }),

  listWithdrawals: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.listWithdrawals(requireAuth(req), req.query));
  }),

  getPersonalInfo: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.getPersonalInfo(requireAuth(req)));
  }),

  updatePersonalInfo: asyncHandler(async (req: Request, res: Response) => {
    res
      .status(HTTP_STATUS.OK)
      .json(await account.updatePersonalInfo(requireAuth(req), req.body as PersonalInfoInput));
  }),

  getExperienceSkills: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.getExperienceSkills(requireAuth(req)));
  }),

  updateExperienceSkills: asyncHandler(async (req: Request, res: Response) => {
    res
      .status(HTTP_STATUS.OK)
      .json(await account.updateExperienceSkills(requireAuth(req), req.body as ExperienceSkillsInput));
  }),

  getDocuments: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.getDocuments(requireAuth(req)));
  }),

  uploadDocument: asyncHandler(async (req: Request, res: Response) => {
    res
      .status(HTTP_STATUS.CREATED)
      .json(await account.uploadDocument(requireAuth(req), req.body as ProviderDocumentInput));
  }),

  getBankAccount: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.getBankAccount(requireAuth(req)));
  }),

  setBankAccount: asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTP_STATUS.OK).json(await account.setBankAccount(requireAuth(req), req.body as BankAccountInput));
  }),

  getAppointmentDetail: asyncHandler(async (req: Request, res: Response) => {
    res
      .status(HTTP_STATUS.OK)
      .json(await providerAppService.getAppointmentDetail(requireAuth(req), req.params.booking_id as string));
  }),
};
