import { z } from 'zod';
import { PROVIDER_TYPES } from '../../common/constants/roles.js';
import { DISCOUNT_TYPES } from './coupon.constants.js';

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric (dashes/underscores allowed)'),
    description: z.string().max(500).default(''),
    discountType: z.enum([DISCOUNT_TYPES.PERCENTAGE, DISCOUNT_TYPES.FLAT]),
    discountValue: z.number().positive(),
    maxDiscountAmount: z.number().positive().optional(),
    minBookingAmount: z.number().min(0).default(0),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().default(1),
    applicableProviderTypes: z
      .array(
        z.enum([
          PROVIDER_TYPES.VET,
          PROVIDER_TYPES.GROOMER,
          PROVIDER_TYPES.BOARDING,
          PROVIDER_TYPES.PET_WALKER,
          PROVIDER_TYPES.TRAINER,
          PROVIDER_TYPES.CLEANER,
          PROVIDER_TYPES.PHARMACY,
          PROVIDER_TYPES.RELOCATION,
          PROVIDER_TYPES.OTHER,
        ]),
      )
      .default([]),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: 'validUntil must be after validFrom',
    path: ['validUntil'],
  });

export const updateCouponSchema = z.object({
  description: z.string().max(500).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  minBookingAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  bookingAmount: z.number().positive(),
  providerType: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
