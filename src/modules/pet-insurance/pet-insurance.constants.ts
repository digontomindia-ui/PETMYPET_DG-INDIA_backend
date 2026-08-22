export const PET_INSURANCE_MODEL_NAME = 'InsuranceApplication';

export const PET_TYPES = { DOG: 'DOG', CAT: 'CAT', OTHER: 'OTHER' } as const;

export type PetType = (typeof PET_TYPES)[keyof typeof PET_TYPES];

export const APPLICATION_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES];
