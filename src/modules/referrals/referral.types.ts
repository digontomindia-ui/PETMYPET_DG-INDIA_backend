import type { HydratedDocument, Types } from 'mongoose';
import type { ReferralStatus } from './referral.constants.js';

export interface IReferral {
  _id: Types.ObjectId;
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  status: ReferralStatus;
  rewardPoints: number;
  redeemedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ReferralDocument = HydratedDocument<IReferral>;
