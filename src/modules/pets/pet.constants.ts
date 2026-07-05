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
