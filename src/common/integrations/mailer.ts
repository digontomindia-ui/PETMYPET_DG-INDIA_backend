import nodemailer from 'nodemailer';
import { env, isTest } from '../config/env.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
});

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (isTest || !env.SMTP_HOST) {
    logger.debug({ to: input.to, subject: input.subject }, 'Email send skipped (no SMTP configured)');
    return;
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to: input.to, subject: input.subject, html: input.html });
}
