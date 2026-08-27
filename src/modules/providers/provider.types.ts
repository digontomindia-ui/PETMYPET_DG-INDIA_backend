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
  /** Training goals this plan serves (e.g. PUPPY_TRAINING) — lets /providers/nearby?trainingGoal=
   * filter trainers down to ones actually offering that goal. */
  goals: string[];
}

export interface ICertification {
  _id: Types.ObjectId;
  title: string;
  issuedBy: string;
  issuedYear: number | null;
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
  petSitter?: {
    maxPetsAtOnce: number;
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
  experienceYears: number | null;
  languages: string[];
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  kycDocuments: Types.DocumentArray<IKycDocument>;
  zoneIds: Types.ObjectId[];
  location: { type: 'Point'; coordinates: [number, number] };
  address: string;
  workingHours: IWorkingHours[];
  unavailableDates: Date[];
  metadata: IProviderMetadata;
  bankAccount: IBankAccount | null;
  commissionPercent: number | null;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  attendance: Types.DocumentArray<IAttendanceEntry>;
  /** Profile photo shown on listing cards and the detail page. */
  profileImageUrl: string | null;
  /** Extra photos for the detail page's gallery. */
  galleryUrls: string[];
  /** Displayed on the detail page under "Experience & Certifications". */
  certifications: Types.DocumentArray<ICertification>;
  /** Displayed as a "98% success rate" stat on the detail page. */
  successRatePercent: number | null;
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

export interface PublicCertification {
  id: string;
  title: string;
  issuedBy: string;
  issuedYear: number | null;
}

export interface PublicProvider {
  id: string;
  userId: string;
  providerType: ProviderType;
  businessName: string;
  description: string;
  experienceYears: number | null;
  languages: string[];
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  kycDocuments: PublicKycDocument[];
  zoneIds: string[];
  location: { type: 'Point'; coordinates: [number, number] };
  address: string;
  workingHours: IWorkingHours[];
  unavailableDates: string[];
  metadata: IProviderMetadata;
  bankAccount: PublicBankAccount | null;
  commissionPercent: number | null;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  attendance: PublicAttendanceEntry[];
  profileImageUrl: string | null;
  galleryUrls: string[];
  certifications: PublicCertification[];
  successRatePercent: number | null;
  /** Populated by the service layer from the linked user account — not stored on Provider itself. */
  contactPhone: string | null;
  /** Cheapest active service price for this provider, or null if it has none yet. Populated by
   * the service layer (Provider has no price of its own — price lives on Service). */
  startingPrice: number | null;
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
  /** Booking count grouped by service category, for a "case mix" breakdown. */
  caseMix: { categoryId: string; categoryName: string; count: number; percent: number }[];
  /** This provider's own services ranked by booking count (Review has no serviceId, so
   * booking volume is the ranking signal here, not per-service rating). */
  topServices: { serviceId: string; name: string; price: number; bookingCount: number }[];
  avgServiceDurationMinutes: number;
  /** Weighted average rating: Σ(rating × count) / Σ(count) across all-time reviews. */
  satisfactionScore: number;
  /** Same-width period immediately preceding the current range, for a growth % on the client. */
  previousPeriodEarnings: number;
}
