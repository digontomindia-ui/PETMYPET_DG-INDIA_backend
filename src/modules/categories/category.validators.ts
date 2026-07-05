import { z } from 'zod';
import { PROVIDER_TYPES } from '../../common/constants/roles.js';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000).default(''),
  iconUrl: z.string().url().optional(),
  providerTypes: z
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
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
