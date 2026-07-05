import type { HydratedDocument, Types } from 'mongoose';
import type { BookingPaymentStatus, BookingStatus, CancelledBy } from './booking.constants.js';

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
  createdAt: Date;
}

export interface OwnerBookingView extends PublicBookingBase {
  otpStart: string | null;
  otpEnd: string | null;
}
