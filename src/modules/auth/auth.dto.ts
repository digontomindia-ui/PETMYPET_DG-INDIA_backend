import type { z } from 'zod';
import type {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  requestOtpLoginSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signupSchema,
  updatePasswordSchema,
  verifyOtpLoginSchema,
  verifySignupSchema,
} from './auth.validators.js';

export type SignupInput = z.infer<typeof signupSchema>;
export type VerifySignupInput = z.infer<typeof verifySignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpLoginInput = z.infer<typeof requestOtpLoginSchema>;
export type VerifyOtpLoginInput = z.infer<typeof verifyOtpLoginSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  deviceId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
