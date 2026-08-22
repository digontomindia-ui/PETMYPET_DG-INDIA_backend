import { model, Schema } from 'mongoose';
import { PROVIDER_TYPES } from '../../common/constants/roles.js';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { workingHoursSchema } from '../../common/schemas/working-hours.schema.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { ZONE_MODEL_NAME } from '../zones/zone.constants.js';
import { KYC_DOCUMENT_TYPES, KYC_STATUSES, PROVIDER_MODEL_NAME } from './provider.constants.js';
import type {
  IAttendanceEntry,
  IBankAccount,
  IKycDocument,
  IProvider,
  IProviderMetadata,
  ITrainingPlan,
} from './provider.types.js';

const kycDocumentSchema = new Schema<IKycDocument>(
  {
    type: { type: String, enum: Object.values(KYC_DOCUMENT_TYPES), required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const bankAccountSchema = new Schema<IBankAccount>(
  {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
  },
  { _id: false },
);

const attendanceEntrySchema = new Schema<IAttendanceEntry>(
  {
    date: { type: String, required: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, default: null },
  },
  { _id: true },
);

const trainingPlanSchema = new Schema<ITrainingPlan>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const metadataSchema = new Schema<IProviderMetadata>(
  {
    vet: {
      specializations: { type: [String], default: undefined },
      consultationFee: { type: Number },
      licenseNumber: { type: String },
      supportsVideoConsultation: { type: Boolean, default: false },
    },
    groomer: {
      specializations: { type: [String], default: undefined },
    },
    boarding: {
      capacity: { type: Number },
      availableKennels: { type: Number },
      amenities: { type: [String], default: undefined },
    },
    trainer: {
      trainingPlans: { type: [trainingPlanSchema], default: undefined },
    },
    petWalker: {
      maxPetsPerWalk: { type: Number },
    },
    petSitter: {
      maxPetsAtOnce: { type: Number },
    },
    pharmacy: {
      licenseNumber: { type: String },
    },
    relocation: {
      vehicleTypes: { type: [String], default: undefined },
    },
  },
  { _id: false },
);

const providerSchema = new Schema<IProvider>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, unique: true },
    providerType: { type: String, enum: Object.values(PROVIDER_TYPES), required: true },
    businessName: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 2000 },
    experienceYears: { type: Number, default: null, min: 0 },
    languages: { type: [String], default: [] },
    kycStatus: { type: String, enum: Object.values(KYC_STATUSES), default: KYC_STATUSES.PENDING },
    kycRejectionReason: { type: String, default: null },
    kycDocuments: { type: [kycDocumentSchema], default: [] },
    zoneIds: { type: [{ type: Schema.Types.ObjectId, ref: ZONE_MODEL_NAME }], default: [] },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, required: true },
    workingHours: { type: [workingHoursSchema], default: [] },
    unavailableDates: { type: [Date], default: [] },
    metadata: { type: metadataSchema, default: () => ({}) },
    bankAccount: { type: bankAccountSchema, default: null },
    commissionPercent: { type: Number, default: null, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    attendance: { type: [attendanceEntrySchema], default: [] },
  },
  { timestamps: true },
);

providerSchema.index({ location: '2dsphere' });
providerSchema.index({ providerType: 1, isActive: 1, kycStatus: 1 });
providerSchema.index({ zoneIds: 1 });
providerSchema.plugin(softDeletePlugin);

export const ProviderModel = model<IProvider>(PROVIDER_MODEL_NAME, providerSchema);
