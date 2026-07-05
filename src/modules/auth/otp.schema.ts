import { model, Schema } from 'mongoose';
import { OTP_MODEL_NAME, OTP_PURPOSES } from './auth.constants.js';
import type { IOtp } from './otp.types.js';

const otpSchema = new Schema<IOtp>({
  identifier: { type: String, required: true, index: true },
  purpose: { type: String, enum: Object.values(OTP_PURPOSES), required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

otpSchema.index({ identifier: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = model<IOtp>(OTP_MODEL_NAME, otpSchema);
