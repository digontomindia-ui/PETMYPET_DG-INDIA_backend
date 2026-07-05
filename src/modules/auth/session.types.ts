import type { HydratedDocument, Types } from 'mongoose';

export interface IDeviceInfo {
  userAgent?: string;
  ip?: string;
  deviceId?: string;
}

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  tokenVersion: number;
  deviceInfo: IDeviceInfo;
  isRevoked: boolean;
  lastUsedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export type SessionDocument = HydratedDocument<ISession>;
