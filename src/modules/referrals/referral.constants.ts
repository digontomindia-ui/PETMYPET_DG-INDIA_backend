export const REFERRAL_MODEL_NAME = 'Referral';

export const REFERRAL_STATUSES = { PENDING: 'PENDING', REWARDED: 'REWARDED' } as const;

export type ReferralStatus = (typeof REFERRAL_STATUSES)[keyof typeof REFERRAL_STATUSES];

export const REFERRAL_REWARD_POINTS = 100;

export const REFERRAL_CODE_LENGTH = 8;

// ponytail: no APP_BASE_URL-style env var exists yet (checked src/common/config/env.ts) — hardcoded
// placeholder domain. Swap for a real configured base URL once the app's public domain is decided.
export const REFERRAL_SHARE_BASE_URL = 'https://patmypets.app/invite';
