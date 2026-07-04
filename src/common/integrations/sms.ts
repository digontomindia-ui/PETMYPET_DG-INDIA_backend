import { env, isTest } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../errors/app-error.js';

const MSG91_API_URL = 'https://control.msg91.com/api/v5/flow/';

export async function sendSms(phone: string, message: string): Promise<void> {
  if (isTest || !env.SMS_API_KEY) {
    logger.debug({ phone }, 'SMS send skipped (no SMS provider configured)');
    return;
  }

  const response = await fetch(MSG91_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: env.SMS_API_KEY },
    body: JSON.stringify({ sender: env.SMS_SENDER_ID, mobiles: phone, message }),
  });

  if (!response.ok) {
    logger.error({ status: response.status, phone }, 'SMS provider request failed');
    throw AppError.internal('Failed to send SMS');
  }
}
