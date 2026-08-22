import type { CouponDocument, PopulatedCouponRedemption } from './coupon.types.js';

export function toCouponRedemptionDto(redemption: PopulatedCouponRedemption) {
  return {
    id: redemption._id.toString(),
    couponId: redemption.couponId._id.toString(),
    code: redemption.couponId.code,
    bookingId: redemption.bookingId.toString(),
    discountAmount: redemption.discountAmount,
    redeemedAt: redemption.redeemedAt,
  };
}

export function toCouponDto(coupon: CouponDocument) {
  return {
    id: coupon._id.toString(),
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountAmount: coupon.maxDiscountAmount,
    minBookingAmount: coupon.minBookingAmount,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount,
    perUserLimit: coupon.perUserLimit,
    applicableProviderTypes: coupon.applicableProviderTypes,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    isActive: coupon.isActive,
  };
}
