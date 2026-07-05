import { model, Schema } from 'mongoose';
import { SESSION_MODEL_NAME } from './auth.constants.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import type { ISession } from './session.types.js';

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, index: true },
  refreshTokenHash: { type: String, required: true },
  tokenVersion: { type: Number, required: true, default: 0 },
  deviceInfo: {
    userAgent: { type: String },
    ip: { type: String },
    deviceId: { type: String },
  },
  isRevoked: { type: Boolean, default: false },
  lastUsedAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

sessionSchema.index({ userId: 1, isRevoked: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<ISession>(SESSION_MODEL_NAME, sessionSchema);
