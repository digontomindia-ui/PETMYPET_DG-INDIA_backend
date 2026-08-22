import { z } from 'zod';
import { APPLICATION_STATUSES, PET_TYPES } from './pet-insurance.constants.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createInsuranceApplicationSchema = z.object({
  ownerName: z.string().min(1).max(120),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
  petName: z.string().min(1).max(60),
  petType: z.enum([PET_TYPES.DOG, PET_TYPES.CAT, PET_TYPES.OTHER]),
  petAge: z.string().min(1).max(30),
  petBreed: z.string().min(1).max(100),
  previousIllness: z.boolean(),
  illnessDocumentUrls: z.array(z.string().url()).max(5).default([]),
  previousSurgery: z.boolean(),
  vaccinated: z.boolean(),
  vaccinationDocumentUrls: z.array(z.string().url()).max(5).default([]),
});

export const updateApplicationStatusSchema = z
  .object({
    status: z.enum([
      APPLICATION_STATUSES.UNDER_REVIEW,
      APPLICATION_STATUSES.APPROVED,
      APPLICATION_STATUSES.REJECTED,
    ]),
    rejectionReason: z.string().min(1).max(500).optional(),
  })
  .refine((data) => data.status !== APPLICATION_STATUSES.REJECTED || !!data.rejectionReason, {
    message: 'rejectionReason is required when status is REJECTED',
    path: ['rejectionReason'],
  });

export const listMyApplicationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const listInsuranceApplicationsQuerySchema = z.object({
  status: z
    .enum([
      APPLICATION_STATUSES.SUBMITTED,
      APPLICATION_STATUSES.UNDER_REVIEW,
      APPLICATION_STATUSES.APPROVED,
      APPLICATION_STATUSES.REJECTED,
    ])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const idParamSchema = z.object({ id: objectIdSchema });
