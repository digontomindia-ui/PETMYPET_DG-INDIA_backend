import { z } from 'zod';
import {
  COMPANION_ACTIVITY_LEVELS,
  GETS_ALONG_WITH_STATUS,
  PET_GENDERS,
  PET_SPECIES,
} from './pet.constants.js';

export const createPetSchema = z.object({
  name: z.string().min(1).max(60),
  species: z.enum([
    PET_SPECIES.DOG,
    PET_SPECIES.CAT,
    PET_SPECIES.BIRD,
    PET_SPECIES.RABBIT,
    PET_SPECIES.FISH,
    PET_SPECIES.OTHER,
  ]),
  breed: z.string().max(100).default(''),
  gender: z
    .enum([PET_GENDERS.MALE, PET_GENDERS.FEMALE, PET_GENDERS.UNKNOWN])
    .default(PET_GENDERS.UNKNOWN),
  dateOfBirth: z.coerce.date().optional(),
  weightKg: z.number().min(0).max(500).optional(),
  avatarUrl: z.string().url().optional(),
  notes: z.string().max(2000).default(''),
});

export const updatePetSchema = createPetSchema.partial();

export const addMedicalRecordSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(2000).default(''),
  fileUrl: z.string().url().optional(),
});

export const addVaccinationSchema = z.object({
  name: z.string().min(1).max(150),
  administeredAt: z.coerce.date(),
  expiresAt: z.coerce.date().optional(),
  certificateUrl: z.string().url().optional(),
});

export const updateCompanionProfileSchema = z.object({
  isEnabled: z.boolean().optional(),
  bio: z.string().max(1000).optional(),
  personalityTraits: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  lookingFor: z.array(z.string()).optional(),
  activityLevel: z
    .enum([
      COMPANION_ACTIVITY_LEVELS.LOW,
      COMPANION_ACTIVITY_LEVELS.MEDIUM,
      COMPANION_ACTIVITY_LEVELS.HIGH,
    ])
    .optional(),
  temperament: z.string().optional(),
  neutered: z.boolean().optional(),
  getsAlongWith: z
    .object({
      dogs: z
        .enum([
          GETS_ALONG_WITH_STATUS.YES,
          GETS_ALONG_WITH_STATUS.NO,
          GETS_ALONG_WITH_STATUS.NEEDS_INTRODUCTION,
        ])
        .optional(),
      cats: z
        .enum([
          GETS_ALONG_WITH_STATUS.YES,
          GETS_ALONG_WITH_STATUS.NO,
          GETS_ALONG_WITH_STATUS.NEEDS_INTRODUCTION,
        ])
        .optional(),
      kids: z
        .enum([
          GETS_ALONG_WITH_STATUS.YES,
          GETS_ALONG_WITH_STATUS.NO,
          GETS_ALONG_WITH_STATUS.NEEDS_INTRODUCTION,
        ])
        .optional(),
      families: z
        .enum([
          GETS_ALONG_WITH_STATUS.YES,
          GETS_ALONG_WITH_STATUS.NO,
          GETS_ALONG_WITH_STATUS.NEEDS_INTRODUCTION,
        ])
        .optional(),
    })
    .optional(),
});

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
export const recordIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
  recordId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid record id'),
});
