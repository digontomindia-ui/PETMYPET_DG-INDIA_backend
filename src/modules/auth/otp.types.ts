import type { HydratedDocument, Types } from 'mongoose';
import type { OtpPurpose } from './auth.constants.js';

export interface IOtp {
  _id: Types.ObjectId;
  identifier: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  lastSentAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export type OtpDocument = HydratedDocument<IOtp>;
