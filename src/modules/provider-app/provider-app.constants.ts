import { PROVIDER_TYPES, type ProviderType } from '../../common/constants/roles.js';

/** The vendor mobile app's kebab-case role slugs, mapped to this backend's ProviderType enum. */
export const ROLE_SLUG_TO_PROVIDER_TYPE = {
  'pet-groomer': PROVIDER_TYPES.GROOMER,
  'pet-clinics': PROVIDER_TYPES.CLINIC,
  vets: PROVIDER_TYPES.VET,
  'boarding-center': PROVIDER_TYPES.BOARDING,
  'dogs-trainer': PROVIDER_TYPES.TRAINER,
  'dog-walker': PROVIDER_TYPES.PET_WALKER,
  'pet-sitter': PROVIDER_TYPES.PET_SITTER,
} as const;

export type ProviderAppRoleSlug = keyof typeof ROLE_SLUG_TO_PROVIDER_TYPE;

export const PROVIDER_APP_ROLE_SLUGS = Object.keys(
  ROLE_SLUG_TO_PROVIDER_TYPE,
) as ProviderAppRoleSlug[];

const PROVIDER_TYPE_TO_ROLE_SLUG = Object.fromEntries(
  Object.entries(ROLE_SLUG_TO_PROVIDER_TYPE).map(([slug, type]) => [type, slug]),
) as Record<ProviderType, ProviderAppRoleSlug | undefined>;

export function roleSlugForProviderType(providerType: ProviderType): ProviderAppRoleSlug | null {
  return PROVIDER_TYPE_TO_ROLE_SLUG[providerType] ?? null;
}

/** Session-lifecycle endpoints resolve "the current session" from the provider's token alone
 * (the spec's OTP payloads carry no bookingId) — these are the statuses considered "about to
 * start" vs "in progress" for that lookup. */
export const SESSION_START_STATUSES = ['ACCEPTED', 'ON_THE_WAY'];
export const SESSION_ACTIVE_STATUSES = ['STARTED'];
