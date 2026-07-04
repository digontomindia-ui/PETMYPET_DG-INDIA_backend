export const ROLES = {
  USER: 'USER',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PROVIDER_TYPES = {
  VET: 'VET',
  GROOMER: 'GROOMER',
  BOARDING: 'BOARDING',
  PET_WALKER: 'PET_WALKER',
  TRAINER: 'TRAINER',
  CLEANER: 'CLEANER',
  PHARMACY: 'PHARMACY',
  RELOCATION: 'RELOCATION',
  OTHER: 'OTHER',
} as const;

export type ProviderType = (typeof PROVIDER_TYPES)[keyof typeof PROVIDER_TYPES];
