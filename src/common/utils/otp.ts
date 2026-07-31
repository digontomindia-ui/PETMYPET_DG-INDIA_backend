import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;
const DEMO_OTP_CODE = '123456';

// ponytail: no SMTP/SMS creds yet, so a real OTP would never reach the user. Fixed demo code
// unblocks testing; switch off automatically once SMTP_HOST or SMS_API_KEY is configured.
function otpDeliveryConfigured(): boolean {
  return Boolean(env.SMTP_HOST) || Boolean(env.SMS_API_KEY);
}

export function generateOtpCode(): string {
  if (!otpDeliveryConfigured()) {
    return DEMO_OTP_CODE.padStart(env.OTP_LENGTH, '1').slice(-env.OTP_LENGTH);
  }
  const min = 10 ** (env.OTP_LENGTH - 1);
  const max = 10 ** env.OTP_LENGTH - 1;
  return String(randomInt(min, max + 1));
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export async function compareOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes('@');
}
