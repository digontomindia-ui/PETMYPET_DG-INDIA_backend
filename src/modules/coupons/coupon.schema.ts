import { model, Schema } from 'mongoose';
import { PROVIDER_TYPES } from '../../common/constants/roles.js';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { BOOKING_MODEL_NAME } from '../bookings/booking.constants.js';
import {
  COUPON_MODEL_NAME,
  COUPON_REDEMPTION_MODEL_NAME,
  DISCOUNT_TYPES,
} from './coupon.constants.js';
import type { ICoupon, ICouponRedemption } from './coupon.types.js';

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '', maxlength: 500 },
    discountType: { type: String, enum: Object.values(DISCOUNT_TYPES), required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    minBookingAmount: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    applicableProviderTypes: { type: [String], enum: Object.values(PROVIDER_TYPES), default: [] },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
couponSchema.plugin(softDeletePlugin);

export const CouponModel = model<ICoupon>(COUPON_MODEL_NAME, couponSchema);

const couponRedemptionSchema = new Schema<ICouponRedemption>({
  couponId: { type: Schema.Types.ObjectId, ref: COUPON_MODEL_NAME, required: true },
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: BOOKING_MODEL_NAME, required: true },
  discountAmount: { type: Number, required: true, min: 0 },
  redeemedAt: { type: Date, default: () => new Date() },
});

couponRedemptionSchema.index({ couponId: 1, userId: 1 });

export const CouponRedemptionModel = model<ICouponRedemption>(
  COUPON_REDEMPTION_MODEL_NAME,
  couponRedemptionSchema,
);
