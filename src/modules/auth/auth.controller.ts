import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { authService } from './auth.service.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RequestOtpLoginInput,
  ResendOtpInput,
  ResetPasswordInput,
  SignupInput,
  UpdatePasswordInput,
  VerifyOtpLoginInput,
  VerifySignupInput,
} from './auth.dto.js';

function extractDeviceInfo(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    deviceId:
      typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : undefined,
  };
}

export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req.body as SignupInput);
    sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      result,
      'Signup successful, please verify the OTP sent to your email',
    );
  }),

  verifySignup: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifySignup(
      req.body as VerifySignupInput,
      extractDeviceInfo(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, result, 'Account verified');
  }),

  resendOtp: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendOtp(req.body as ResendOtpInput);
    sendSuccess(res, HTTP_STATUS.OK, null, 'OTP sent');
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput, extractDeviceInfo(req));
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      result,
      result.isRegistered ? 'Login successful' : 'No account found for this email',
    );
  }),

  requestOtpLogin: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestOtpLogin(req.body as RequestOtpLoginInput);
    sendSuccess(
      res,
      HTTP_STATUS.OK,
      result,
      result.isRegistered ? 'OTP sent' : 'No account found for this identifier',
    );
  }),

  verifyOtpLogin: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyOtpLogin(
      req.body as VerifyOtpLoginInput,
      extractDeviceInfo(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, result, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, HTTP_STATUS.OK, tokens, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Logged out');
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await authService.logoutAll(req.user.userId);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Logged out of all devices');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body as ForgotPasswordInput);
    sendSuccess(res, HTTP_STATUS.OK, null, 'If an account exists, an OTP has been sent');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body as ResetPasswordInput);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Password reset successful');
  }),

  updatePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await authService.updatePassword(req.user.userId, req.body as UpdatePasswordInput);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Password updated');
  }),
};
