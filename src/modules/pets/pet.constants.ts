export const PET_MODEL_NAME = 'Pet';

export const PET_SPECIES = {
  DOG: 'DOG',
  CAT: 'CAT',
  BIRD: 'BIRD',
  RABBIT: 'RABBIT',
  FISH: 'FISH',
  OTHER: 'OTHER',
} as const;

export type PetSpecies = (typeof PET_SPECIES)[keyof typeof PET_SPECIES];

export const PET_GENDERS = { MALE: 'MALE', FEMALE: 'FEMALE', UNKNOWN: 'UNKNOWN' } as const;

export type PetGender = (typeof PET_GENDERS)[keyof typeof PET_GENDERS];

export const COMPANION_ACTIVITY_LEVELS = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' } as const;

export type CompanionActivityLevel =
  (typeof COMPANION_ACTIVITY_LEVELS)[keyof typeof COMPANION_ACTIVITY_LEVELS];

export const GETS_ALONG_WITH_STATUS = {
  YES: 'YES',
  NO: 'NO',
  NEEDS_INTRODUCTION: 'NEEDS_INTRODUCTION',
} as const;

export type GetsAlongWithStatus =
  (typeof GETS_ALONG_WITH_STATUS)[keyof typeof GETS_ALONG_WITH_STATUS];

export const PET_ACTIVITY_TYPES = {
  PARK_VISIT: 'PARK_VISIT',
  MEETUP: 'MEETUP',
  PLAYDATE: 'PLAYDATE',
  WALK: 'WALK',
  OTHER: 'OTHER',
} as const;

export type PetActivityType = (typeof PET_ACTIVITY_TYPES)[keyof typeof PET_ACTIVITY_TYPES];
