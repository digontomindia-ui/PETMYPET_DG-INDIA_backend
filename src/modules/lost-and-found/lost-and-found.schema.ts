import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  APPROVAL_STATUSES,
  LOST_AND_FOUND_MODEL_NAME,
  LOST_AND_FOUND_STATUSES,
  LOST_AND_FOUND_TYPES,
} from './lost-and-found.constants.js';
import type { ILostAndFoundPost } from './lost-and-found.types.js';

const lostAndFoundSchema = new Schema<ILostAndFoundPost>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    type: { type: String, enum: Object.values(LOST_AND_FOUND_TYPES), required: true },
    petName: { type: String, default: '' },
    species: { type: String, required: true },
    breed: { type: String, default: '' },
    description: { type: String, required: true, maxlength: 2000 },
    photoUrls: { type: [String], default: [] },
    lastSeenLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    contactPhone: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(LOST_AND_FOUND_STATUSES),
      default: LOST_AND_FOUND_STATUSES.ACTIVE,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUSES),
      default: APPROVAL_STATUSES.PENDING,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

lostAndFoundSchema.index({ lastSeenLocation: '2dsphere' });
lostAndFoundSchema.index({ approvalStatus: 1, status: 1, createdAt: -1 });
lostAndFoundSchema.plugin(softDeletePlugin);

export const LostAndFoundModel = model<ILostAndFoundPost>(
  LOST_AND_FOUND_MODEL_NAME,
  lostAndFoundSchema,
);
