import type { HydratedDocument, Types } from 'mongoose';
import type { ProviderType } from '../../common/constants/roles.js';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { DiscountType } from './coupon.constants.js';

export interface ICoupon extends SoftDeletable {
  _id: Types.ObjectId;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minBookingAmount: number;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  applicableProviderTypes: ProviderType[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CouponDocument = HydratedDocument<ICoupon>;

export interface ICouponRedemption {
  _id: Types.ObjectId;
  couponId: Types.ObjectId;
  userId: Types.ObjectId;
  bookingId: Types.ObjectId;
  discountAmount: number;
  redeemedAt: Date;
}

export type CouponRedemptionDocument = HydratedDocument<ICouponRedemption>;

/** A redemption doc (lean) whose couponId has been populated down to just its code. */
export type PopulatedCouponRedemption = Omit<ICouponRedemption, 'couponId'> & {
  couponId: Pick<ICoupon, '_id' | 'code'>;
};
