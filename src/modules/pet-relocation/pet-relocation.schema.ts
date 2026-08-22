import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PET_MODEL_NAME } from '../pets/pet.constants.js';
import {
  RELOCATION_REQUEST_MODEL_NAME,
  RELOCATION_STATUSES,
  TIME_SLOTS,
  TRANSPORT_TYPES,
} from './pet-relocation.constants.js';
import type { IRelocationRequest } from './pet-relocation.types.js';

const relocationRequestSchema = new Schema<IRelocationRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    ownerName: { type: String, required: true, minlength: 1, maxlength: 120 },
    ownerPhone: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    petId: { type: Schema.Types.ObjectId, ref: PET_MODEL_NAME, required: true },
    originAddress: { type: String, required: true, minlength: 1, maxlength: 500 },
    destinationAddress: { type: String, required: true, minlength: 1, maxlength: 500 },
    relocationDate: { type: Date, required: true },
    transportType: { type: String, enum: Object.values(TRANSPORT_TYPES), required: true },
    preferredTimeSlot: { type: String, enum: Object.values(TIME_SLOTS), required: true },
    status: {
      type: String,
      enum: Object.values(RELOCATION_STATUSES),
      default: RELOCATION_STATUSES.SUBMITTED,
    },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true },
);

relocationRequestSchema.index({ userId: 1, createdAt: -1 });
relocationRequestSchema.index({ status: 1, createdAt: -1 });
relocationRequestSchema.plugin(softDeletePlugin);

export const RelocationRequestModel = model<IRelocationRequest>(
  RELOCATION_REQUEST_MODEL_NAME,
  relocationRequestSchema,
);
