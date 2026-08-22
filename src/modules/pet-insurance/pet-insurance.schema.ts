import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  APPLICATION_STATUSES,
  PET_INSURANCE_MODEL_NAME,
  PET_TYPES,
} from './pet-insurance.constants.js';
import type { IInsuranceApplication } from './pet-insurance.types.js';

const insuranceApplicationSchema = new Schema<IInsuranceApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    ownerName: { type: String, required: true, minlength: 1, maxlength: 120 },
    ownerEmail: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    petName: { type: String, required: true, minlength: 1, maxlength: 60 },
    petType: { type: String, enum: Object.values(PET_TYPES), required: true },
    petAge: { type: String, required: true, minlength: 1, maxlength: 30 },
    petBreed: { type: String, required: true, minlength: 1, maxlength: 100 },
    previousIllness: { type: Boolean, required: true },
    illnessDocumentUrls: { type: [String], default: [] },
    previousSurgery: { type: Boolean, required: true },
    vaccinated: { type: Boolean, required: true },
    vaccinationDocumentUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUSES),
      default: APPLICATION_STATUSES.SUBMITTED,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

insuranceApplicationSchema.index({ userId: 1, createdAt: -1 });
insuranceApplicationSchema.index({ status: 1, createdAt: -1 });
insuranceApplicationSchema.plugin(softDeletePlugin);

export const InsuranceApplicationModel = model<IInsuranceApplication>(
  PET_INSURANCE_MODEL_NAME,
  insuranceApplicationSchema,
);
