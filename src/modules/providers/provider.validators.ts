import { z } from 'zod';
import { PROVIDER_TYPES } from '../../common/constants/roles.js';
import { workingHoursInputSchema } from '../../common/validators/working-hours.validator.js';
import { KYC_DOCUMENT_TYPES } from './provider.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const trainingPlanInputSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).default(''),
  price: z.number().min(0),
  durationDays: z.number().int().min(1),
});

const metadataSchema = z
  .object({
    vet: z
      .object({
        specializations: z.array(z.string()).default([]),
        consultationFee: z.number().min(0),
        licenseNumber: z.string().min(1),
        supportsVideoConsultation: z.boolean().default(false),
      })
      .optional(),
    groomer: z.object({ specializations: z.array(z.string()).default([]) }).optional(),
    boarding: z
      .object({
        capacity: z.number().int().min(1),
        availableKennels: z.number().int().min(0),
        amenities: z.array(z.string()).default([]),
      })
      .optional(),
    trainer: z.object({ trainingPlans: z.array(trainingPlanInputSchema).default([]) }).optional(),
    petWalker: z.object({ maxPetsPerWalk: z.number().int().min(1) }).optional(),
    petSitter: z.object({ maxPetsAtOnce: z.number().int().min(1) }).optional(),
    pharmacy: z.object({ licenseNumber: z.string().min(1) }).optional(),
    relocation: z.object({ vehicleTypes: z.array(z.string()).default([]) }).optional(),
  })
  .default({});

export const createProviderProfileSchema = z.object({
  providerType: z.enum([
    PROVIDER_TYPES.VET,
    PROVIDER_TYPES.GROOMER,
    PROVIDER_TYPES.BOARDING,
    PROVIDER_TYPES.PET_WALKER,
    PROVIDER_TYPES.PET_SITTER,
    PROVIDER_TYPES.TRAINER,
    PROVIDER_TYPES.CLEANER,
    PROVIDER_TYPES.PHARMACY,
    PROVIDER_TYPES.RELOCATION,
    PROVIDER_TYPES.OTHER,
  ]),
  businessName: z.string().min(1).max(150),
  description: z.string().max(2000).default(''),
  experienceYears: z.number().int().min(0).optional(),
  languages: z.array(z.string()).default([]),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  address: z.string().min(1).max(500),
  zoneIds: z.array(objectIdSchema).default([]),
  workingHours: z.array(workingHoursInputSchema).default([]),
  metadata: metadataSchema,
});

export const updateProviderProfileSchema = createProviderProfileSchema.partial();

export const uploadKycDocumentSchema = z.object({
  type: z.enum([
    KYC_DOCUMENT_TYPES.GOVERNMENT_ID,
    KYC_DOCUMENT_TYPES.BUSINESS_LICENSE,
    KYC_DOCUMENT_TYPES.PROFESSIONAL_CERTIFICATE,
    KYC_DOCUMENT_TYPES.ADDRESS_PROOF,
    KYC_DOCUMENT_TYPES.OTHER,
  ]),
  url: z.string().url(),
});

export const rejectKycSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const nearbyProvidersQuerySchema = z.object({
  lat: z.string().refine((v) => !Number.isNaN(Number(v)), 'lat must be a number'),
  lng: z.string().refine((v) => !Number.isNaN(Number(v)), 'lng must be a number'),
  radiusMeters: z.string().optional(),
  providerType: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const setBankAccountSchema = z.object({
  accountHolderName: z.string().min(1).max(150),
  accountNumber: z.string().min(4).max(30),
  ifscCode: z.string().min(4).max(15),
  bankName: z.string().min(1).max(150),
});

export const idParamSchema = z.object({ id: objectIdSchema });
export const documentIdParamSchema = z.object({ id: objectIdSchema, documentId: objectIdSchema });

export const providerAnalyticsQuerySchema = z.object({
  range: z.enum(['week', 'month']).optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const addUnavailableDateSchema = z.object({
  date: z.coerce.date(),
});

export const unavailableDateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
});
