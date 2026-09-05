import type { HydratedDocument, Types } from 'mongoose';
import type {
  BookingPaymentStatus,
  BookingStatus,
  CancelledBy,
  ConsultationMode,
} from './booking.constants.js';

export interface IBookingAddOn {
  name: string;
  price: number;
}

export const BOOKING_PHOTO_PHASES = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
} as const;

export type BookingPhotoPhase = (typeof BOOKING_PHOTO_PHASES)[keyof typeof BOOKING_PHOTO_PHASES];

export interface IBookingPhoto {
  url: string;
  phase: BookingPhotoPhase;
  uploadedAt: Date;
}

/** Latest snapshot pushed by the provider's app over the walk:update socket event, persisted so
 * the owner's app has a starting point on load instead of waiting for the next live tick. */
export interface IWalkStats {
  distanceMeters: number;
  durationSeconds: number;
  steps: number;
  calories: number;
  updatedAt: Date;
}

export interface IBooking {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  petId: Types.ObjectId | null;
  providerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  zoneId: Types.ObjectId | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: BookingStatus;
  otpStart: string;
  otpStartVerifiedAt: Date | null;
  otpEnd: string;
  otpEndVerifiedAt: Date | null;
  price: number;
  currency: string;
  couponCode: string | null;
  discountAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  providerPayoutAmount: number;
  paymentStatus: BookingPaymentStatus;
  paymentId: Types.ObjectId | null;
  cancelledBy: CancelledBy | null;
  cancellationReason: string | null;
  notes: string;
  addOns: IBookingAddOn[];
  durationDays: number | null;
  dropOffTime: string | null;
  pickupTime: string | null;
  consultationMode: ConsultationMode | null;
  providerNotes: string;
  photos: IBookingPhoto[];
  walkStats: IWalkStats | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = HydratedDocument<IBooking>;

export interface PublicBookingBase {
  id: string;
  userId: string;
  petId: string | null;
  providerId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  zoneId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: BookingStatus;
  price: number;
  currency: string;
  couponCode: string | null;
  discountAmount: number;
  paymentStatus: BookingPaymentStatus;
  cancelledBy: CancelledBy | null;
  cancellationReason: string | null;
  notes: string;
  addOns: IBookingAddOn[];
  durationDays: number | null;
  dropOffTime: string | null;
  pickupTime: string | null;
  consultationMode: ConsultationMode | null;
  /** Provider-only session notes; present here because this same shape is the provider's view. */
  providerNotes: string;
  photos: IBookingPhoto[];
  walkStats: IWalkStats | null;
  createdAt: Date;
}

export interface OwnerBookingView extends PublicBookingBase {
  otpStart: string | null;
  otpEnd: string | null;
}
