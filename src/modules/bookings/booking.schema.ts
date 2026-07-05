import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PET_MODEL_NAME } from '../pets/pet.constants.js';
import { PROVIDER_MODEL_NAME } from '../providers/provider.constants.js';
import { SERVICE_MODEL_NAME } from '../services/service.constants.js';
import { ZONE_MODEL_NAME } from '../zones/zone.constants.js';
import {
  BOOKING_MODEL_NAME,
  BOOKING_STATUSES,
  CANCELLED_BY,
  PAYMENT_STATUSES,
} from './booking.constants.js';
import type { IBooking } from './booking.types.js';

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    petId: { type: Schema.Types.ObjectId, ref: PET_MODEL_NAME, default: null },
    providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: SERVICE_MODEL_NAME, required: true },
    zoneId: { type: Schema.Types.ObjectId, ref: ZONE_MODEL_NAME, default: null },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING,
    },
    otpStart: { type: String, required: true },
    otpStartVerifiedAt: { type: Date, default: null },
    otpEnd: { type: String, required: true },
    otpEndVerifiedAt: { type: Date, default: null },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    couponCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0, min: 0 },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, default: 0, min: 0 },
    providerPayoutAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
    },
    paymentId: { type: Schema.Types.ObjectId, default: null },
    cancelledBy: { type: String, enum: Object.values(CANCELLED_BY), default: null },
    cancellationReason: { type: String, default: null },
    notes: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1, status: 1, scheduledStart: -1 });
bookingSchema.index({ providerId: 1, status: 1, scheduledStart: 1 });
bookingSchema.index({ providerId: 1, scheduledStart: 1, scheduledEnd: 1 });

export const BookingModel = model<IBooking>(BOOKING_MODEL_NAME, bookingSchema);
