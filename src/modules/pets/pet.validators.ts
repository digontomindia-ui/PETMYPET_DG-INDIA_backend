import { z } from 'zod';
import { PET_GENDERS, PET_SPECIES } from './pet.constants.js';

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

export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
export const recordIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
  recordId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid record id'),
});
