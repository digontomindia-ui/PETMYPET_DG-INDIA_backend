import type { z } from 'zod';
import type {
  createCouponSchema,
  listRedemptionsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupon.validators.js';

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type ListRedemptionsQuery = z.infer<typeof listRedemptionsQuerySchema>;

export interface CouponValidationResult {
  couponId: string;
  code: string;
  discountAmount: number;
}
