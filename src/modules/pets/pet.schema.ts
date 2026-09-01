import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PROVIDER_MODEL_NAME } from '../providers/provider.constants.js';
import {
  COMPANION_ACTIVITY_LEVELS,
  GETS_ALONG_WITH_STATUS,
  PET_ACTIVITY_TYPES,
  PET_GENDERS,
  PET_MODEL_NAME,
  PET_SPECIES,
} from './pet.constants.js';
import type {
  ICompanionProfile,
  IMedicalRecord,
  IPet,
  IPetActivity,
  IVaccination,
} from './pet.types.js';

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fileUrl: { type: String, default: null },
    providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, default: null },
    recordedAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const vaccinationSchema = new Schema<IVaccination>(
  {
    name: { type: String, required: true, trim: true },
    administeredAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    certificateUrl: { type: String, default: null },
    providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, default: null },
  },
  { _id: true },
);

const petActivitySchema = new Schema<IPetActivity>(
  {
    type: { type: String, enum: Object.values(PET_ACTIVITY_TYPES), required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    location: { type: String, default: null, trim: true },
    occurredAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const companionProfileSchema = new Schema<ICompanionProfile>(
  {
    isEnabled: { type: Boolean, default: false },
    bio: { type: String, default: '', maxlength: 1000 },
    personalityTraits: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    lookingFor: { type: [String], default: [] },
    activityLevel: {
      type: String,
      enum: Object.values(COMPANION_ACTIVITY_LEVELS),
      default: COMPANION_ACTIVITY_LEVELS.MEDIUM,
    },
    temperament: { type: String, default: '' },
    neutered: { type: Boolean, default: false },
    getsAlongWith: {
      dogs: {
        type: String,
        enum: Object.values(GETS_ALONG_WITH_STATUS),
        default: GETS_ALONG_WITH_STATUS.YES,
      },
      cats: {
        type: String,
        enum: Object.values(GETS_ALONG_WITH_STATUS),
        default: GETS_ALONG_WITH_STATUS.YES,
      },
      kids: {
        type: String,
        enum: Object.values(GETS_ALONG_WITH_STATUS),
        default: GETS_ALONG_WITH_STATUS.YES,
      },
      families: {
        type: String,
        enum: Object.values(GETS_ALONG_WITH_STATUS),
        default: GETS_ALONG_WITH_STATUS.YES,
      },
    },
  },
  { _id: false },
);

const petSchema = new Schema<IPet>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    species: { type: String, enum: Object.values(PET_SPECIES), required: true },
    breed: { type: String, default: '', trim: true },
    gender: { type: String, enum: Object.values(PET_GENDERS), default: PET_GENDERS.UNKNOWN },
    dateOfBirth: { type: Date, default: null },
    weightKg: { type: Number, default: null, min: 0 },
    avatarUrl: { type: String, default: null },
    galleryUrls: { type: [String], default: [] },
    notes: { type: String, default: '', maxlength: 2000 },
    medicalRecords: { type: [medicalRecordSchema], default: [] },
    vaccinations: { type: [vaccinationSchema], default: [] },
    activities: { type: [petActivitySchema], default: [] },
    companionProfile: { type: companionProfileSchema, default: null },
    viewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

petSchema.index({ ownerId: 1, isDeleted: 1 });
petSchema.index({ 'companionProfile.isEnabled': 1 });
petSchema.plugin(softDeletePlugin);

export const PetModel = model<IPet>(PET_MODEL_NAME, petSchema);
