import type { HydratedDocument, Types } from 'mongoose';
import type { ProviderType } from '../../common/constants/roles.js';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { IWorkingHours } from '../../common/schemas/working-hours.schema.js';
import type { KycDocumentType, KycStatus } from './provider.constants.js';

export interface IKycDocument {
  _id: Types.ObjectId;
  type: KycDocumentType;
  url: string;
  uploadedAt: Date;
}

export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface IAttendanceEntry {
  _id: Types.ObjectId;
  date: string;
  checkInAt: Date;
  checkOutAt: Date | null;
}

export interface ITrainingPlan {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  durationDays: number;
}

export interface IProviderMetadata {
  vet?: {
    specializations: string[];
    consultationFee: number;
    licenseNumber: string;
    supportsVideoConsultation: boolean;
  };
  groomer?: {
    specializations: string[];
  };
  boarding?: {
    capacity: number;
    availableKennels: number;
    amenities: string[];
  };
  trainer?: {
    trainingPlans: ITrainingPlan[];
  };
  petWalker?: {
    maxPetsPerWalk: number;
  };
  pharmacy?: {
    licenseNumber: string;
  };
  relocation?: {
    vehicleTypes: string[];
  };
}

export interface IProvider extends SoftDeletable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  providerType: ProviderType;
  businessName: string;
  description: string;
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  kycDocuments: Types.DocumentArray<IKycDocument>;
  zoneIds: Types.ObjectId[];
  location: { type: 'Point'; coordinates: [number, number] };
  address: string;
  workingHours: IWorkingHours[];
  metadata: IProviderMetadata;
  bankAccount: IBankAccount | null;
  commissionPercent: number | null;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  attendance: Types.DocumentArray<IAttendanceEntry>;
  createdAt: Date;
  updatedAt: Date;
}

export type ProviderDocument = HydratedDocument<IProvider>;

export interface PublicKycDocument {
  id: string;
  type: KycDocumentType;
  url: string;
  uploadedAt: Date;
}

export interface PublicBankAccount {
  accountHolderName: string;
  bankName: string;
  last4: string;
}

export interface PublicAttendanceEntry {
  id: string;
  date: string;
  checkInAt: Date;
  checkOutAt: Date | null;
}

export interface PublicProvider {
  id: string;
  userId: string;
  providerType: ProviderType;
  businessName: string;
  description: string;
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  kycDocuments: PublicKycDocument[];
  zoneIds: string[];
  location: { type: 'Point'; coordinates: [number, number] };
  address: string;
  workingHours: IWorkingHours[];
  metadata: IProviderMetadata;
  bankAccount: PublicBankAccount | null;
  commissionPercent: number | null;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  attendance: PublicAttendanceEntry[];
  createdAt: Date;
}

/**
 * Shown on PUBLIC provider endpoints (GET /providers/:id, /providers/nearby) — omits
 * kycDocuments, kycRejectionReason, bankAccount, and attendance, which are only meant
 * for the provider's own /me view or admin review, never for a browsing customer.
 */
export type PublicProviderSummary = Omit<
  PublicProvider,
  'kycRejectionReason' | 'kycDocuments' | 'bankAccount' | 'attendance'
>;

export interface ProviderAnalytics {
  earningsByDay: { date: string; amount: number }[];
  bookingCount: number;
  ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
  repeatClientPercent: number;
}
