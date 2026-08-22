import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  REFERRAL_MODEL_NAME,
  REFERRAL_REWARD_POINTS,
  REFERRAL_STATUSES,
} from './referral.constants.js';
import type { IReferral } from './referral.types.js';

const referralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: USER_MODEL_NAME,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(REFERRAL_STATUSES),
      default: REFERRAL_STATUSES.PENDING,
    },
    rewardPoints: { type: Number, default: REFERRAL_REWARD_POINTS },
    redeemedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

referralSchema.index({ referrerId: 1, status: 1 });

export const ReferralModel = model<IReferral>(REFERRAL_MODEL_NAME, referralSchema);
