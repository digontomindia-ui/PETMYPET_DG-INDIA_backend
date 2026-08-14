import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/app-error.js';
import { hashPassword, comparePassword } from '../../common/utils/password.js';
import {
  compareOtpCode,
  generateOtpCode,
  hashOtpCode,
  isEmailIdentifier,
} from '../../common/utils/otp.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.js';
import { sendEmail } from '../../common/integrations/mailer.js';
import { sendSms } from '../../common/integrations/sms.js';
import { logger } from '../../common/utils/logger.js';
import { userRepository } from '../users/user.repository.js';
import { toPublicUser } from '../users/user.mapper.js';
import type { PublicUser, UserDocument } from '../users/user.types.js';
import { otpRepository } from './otp.repository.js';
import { sessionRepository } from './session.repository.js';
import { OTP_PURPOSES, type OtpPurpose } from './auth.constants.js';
import type {
  AuthTokens,
  DeviceInfo,
  ForgotPasswordInput,
  LoginInput,
  RequestOtpLoginInput,
  ResendOtpInput,
  ResetPasswordInput,
  SignupInput,
  UpdatePasswordInput,
  VerifyOtpLoginInput,
  VerifySignupInput,
} from './auth.dto.js';

const REFRESH_TOKEN_TTL_MS = parseDurationToMs(env.JWT_REFRESH_TTL);

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unitMs =
    { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as string] ?? 86_400_000;
  return value * unitMs;
}

async function findUserByIdentifier(identifier: string): Promise<UserDocument | null> {
  return isEmailIdentifier(identifier)
    ? userRepository.findByEmail(identifier)
    : userRepository.findByPhone(identifier);
}

async function sendOtpToIdentifier(
  identifier: string,
  code: string,
  purpose: OtpPurpose,
): Promise<void> {
  const message = `Your Patmypets verification code is ${code}. It expires in ${Math.round(env.OTP_TTL_SECONDS / 60)} minutes.`;
  if (isEmailIdentifier(identifier)) {
    await sendEmail({
      to: identifier,
      subject: 'Your Patmypets verification code',
      html: `<p>${message}</p>`,
    });
  } else {
    await sendSms(identifier, message);
  }
  logger.debug({ identifier, purpose }, 'OTP dispatched');
}

async function issueOtp(identifier: string, purpose: OtpPurpose): Promise<void> {
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);
  await otpRepository.invalidateAll(identifier, purpose);
  await otpRepository.create(identifier, purpose, codeHash, expiresAt);
  await sendOtpToIdentifier(identifier, code, purpose);
}

async function verifyOtp(identifier: string, purpose: OtpPurpose, code: string): Promise<void> {
  const otp = await otpRepository.findLatest(identifier, purpose);
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest('OTP has expired, please request a new one');
  }
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    await otpRepository.deleteById(otp._id.toString());
    throw AppError.badRequest('Too many incorrect attempts, please request a new OTP');
  }

  const isValid = await compareOtpCode(code, otp.codeHash);
  if (!isValid) {
    await otpRepository.incrementAttempts(otp._id.toString());
    throw AppError.badRequest('Invalid OTP');
  }

  await otpRepository.invalidateAll(identifier, purpose);
}

async function issueTokens(user: UserDocument, deviceInfo: DeviceInfo): Promise<AuthTokens> {
  const session = await sessionRepository.create(
    user._id.toString(),
    'pending',
    new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    deviceInfo,
  );

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    sessionId: session._id.toString(),
  });
  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
    sessionId: session._id.toString(),
    tokenVersion: 0,
  });

  const refreshTokenHash = await hashPassword(refreshToken);
  await sessionRepository.rotate(session._id.toString(), refreshTokenHash, 0);

  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL };
}

export const authService = {
  async signup(input: SignupInput): Promise<{ userId: string; identifier: string }> {
    const existingByEmail = await userRepository.findByEmail(input.email);
    if (existingByEmail) throw AppError.conflict('An account with this email already exists');
    const existingByPhone = await userRepository.findByPhone(input.phone);
    if (existingByPhone)
      throw AppError.conflict('An account with this phone number already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      role: input.role,
      isVerified: false,
    });

    await issueOtp(input.email.toLowerCase(), OTP_PURPOSES.SIGNUP);

    return { userId: user._id.toString(), identifier: user.email };
  },

  async verifySignup(
    input: VerifySignupInput,
    deviceInfo: DeviceInfo,
  ): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    await verifyOtp(input.identifier, OTP_PURPOSES.SIGNUP, input.code);

    const user = await findUserByIdentifier(input.identifier);
    if (!user) throw AppError.notFound('No pending signup found for this identifier');

    user.isVerified = true;
    await user.save();

    const tokens = await issueTokens(user, deviceInfo);
    return { user: toPublicUser(user), tokens };
  },

  async resendOtp(input: ResendOtpInput): Promise<void> {
    const existingOtp = await otpRepository.findLatest(input.identifier, input.purpose);
    if (existingOtp) {
      const cooldownEndsAt =
        existingOtp.lastSentAt.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
      if (cooldownEndsAt > Date.now()) {
        throw AppError.tooManyRequests('Please wait before requesting another OTP');
      }
    }
    await issueOtp(input.identifier, input.purpose);
  },

  async login(
    input: LoginInput,
    deviceInfo: DeviceInfo,
  ): Promise<{ isRegistered: boolean; user: PublicUser | null; tokens: AuthTokens | null }> {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user) return { isRegistered: false, user: null, tokens: null };
    if (user.isBlocked) throw AppError.forbidden('This account has been blocked');

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) throw AppError.unauthorized('Invalid email or password');

    if (!user.isVerified) throw AppError.forbidden('Please verify your account before logging in');

    const tokens = await issueTokens(user, deviceInfo);
    return { isRegistered: true, user: toPublicUser(user), tokens };
  },

  async requestOtpLogin(input: RequestOtpLoginInput): Promise<{ isRegistered: boolean }> {
    const user = await findUserByIdentifier(input.identifier);
    if (!user) return { isRegistered: false };
    if (user.isBlocked) throw AppError.forbidden('This account has been blocked');

    await issueOtp(input.identifier, OTP_PURPOSES.LOGIN);
    return { isRegistered: true };
  },

  async verifyOtpLogin(
    input: VerifyOtpLoginInput,
    deviceInfo: DeviceInfo,
  ): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    await verifyOtp(input.identifier, OTP_PURPOSES.LOGIN, input.code);

    const user = await findUserByIdentifier(input.identifier);
    if (!user) throw AppError.notFound('No account found for this identifier');

    user.isVerified = true;
    await user.save();

    const tokens = await issueTokens(user, deviceInfo);
    return { user: toPublicUser(user), tokens };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const session = await sessionRepository.findActiveById(payload.sessionId);

    if (!session || session.tokenVersion !== payload.tokenVersion) {
      if (session) await sessionRepository.revoke(session._id.toString());
      throw AppError.unauthorized('Session is no longer valid, please log in again');
    }

    const tokenMatches = await comparePassword(refreshToken, session.refreshTokenHash);
    if (!tokenMatches) {
      // Refresh token reuse detected: the presented token doesn't match the last-issued one
      // for this session, so every session for this user is revoked as a precaution.
      await sessionRepository.revokeAllForUser(session.userId.toString());
      throw AppError.unauthorized('Session is no longer valid, please log in again');
    }

    const user = await userRepository.findById(session.userId.toString());
    if (!user || user.isBlocked) throw AppError.unauthorized('Account is unavailable');

    const nextTokenVersion = session.tokenVersion + 1;
    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: user.role,
      sessionId: session._id.toString(),
    });
    const newRefreshToken = signRefreshToken({
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      tokenVersion: nextTokenVersion,
    });

    const refreshTokenHash = await hashPassword(newRefreshToken);
    await sessionRepository.rotate(session._id.toString(), refreshTokenHash, nextTokenVersion);

    return { accessToken, refreshToken: newRefreshToken, expiresIn: env.JWT_ACCESS_TTL };
  },

  async logout(refreshToken: string): Promise<void> {
    const payload = verifyRefreshToken(refreshToken);
    await sessionRepository.revoke(payload.sessionId);
  },

  async logoutAll(userId: string): Promise<void> {
    await sessionRepository.revokeAllForUser(userId);
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await findUserByIdentifier(input.identifier);
    if (!user) return; // do not reveal account existence
    await issueOtp(input.identifier, OTP_PURPOSES.PASSWORD_RESET);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await verifyOtp(input.identifier, OTP_PURPOSES.PASSWORD_RESET, input.code);

    const user = await findUserByIdentifier(input.identifier);
    if (!user) throw AppError.notFound('No account found for this identifier');

    user.passwordHash = await hashPassword(input.newPassword);
    await user.save();
    await sessionRepository.revokeAllForUser(user._id.toString());
  },

  async updatePassword(userId: string, input: UpdatePasswordInput): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw AppError.notFound('User not found');

    const matches = await comparePassword(input.oldPassword, user.passwordHash);
    if (!matches) throw AppError.badRequest('Current password is incorrect');

    user.passwordHash = await hashPassword(input.newPassword);
    await user.save();
    await sessionRepository.revokeAllForUser(userId);
  },
};
