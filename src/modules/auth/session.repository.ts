import { Types } from 'mongoose';
import { SessionModel } from './session.schema.js';
import type { IDeviceInfo, SessionDocument } from './session.types.js';

export const sessionRepository = {
  async create(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    deviceInfo: IDeviceInfo,
  ): Promise<SessionDocument> {
    return SessionModel.create({
      userId: new Types.ObjectId(userId),
      refreshTokenHash,
      tokenVersion: 0,
      deviceInfo,
      expiresAt,
      lastUsedAt: new Date(),
    });
  },

  async findActiveById(sessionId: string): Promise<SessionDocument | null> {
    return SessionModel.findOne({ _id: sessionId, isRevoked: false }).exec();
  },

  async rotate(sessionId: string, refreshTokenHash: string, tokenVersion: number): Promise<void> {
    await SessionModel.updateOne(
      { _id: sessionId },
      { refreshTokenHash, tokenVersion, lastUsedAt: new Date() },
    ).exec();
  },

  async revoke(sessionId: string): Promise<void> {
    await SessionModel.updateOne({ _id: sessionId }, { isRevoked: true }).exec();
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await SessionModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isRevoked: true },
    ).exec();
  },
};
