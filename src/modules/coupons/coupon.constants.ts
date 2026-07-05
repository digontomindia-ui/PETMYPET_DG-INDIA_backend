export const COUPON_MODEL_NAME = 'Coupon';
export const COUPON_REDEMPTION_MODEL_NAME = 'CouponRedemption';

export const DISCOUNT_TYPES = { PERCENTAGE: 'PERCENTAGE', FLAT: 'FLAT' } as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];
