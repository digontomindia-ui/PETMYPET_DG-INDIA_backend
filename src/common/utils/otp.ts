import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

export function generateOtpCode(): string {
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
