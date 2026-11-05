export const PROVIDER_MODEL_NAME = 'Provider';

/** Placeholder businessName/address a provider carries between phone verification and completing
 * onboarding (the vendor app creates the account at verify-OTP, before any real details exist).
 * Onboarding always overwrites businessName with the real name, so this exact value is the single
 * signal for "shell account, not a real vendor yet" — used to hide shells from admin views and to
 * let a half-registered number re-register as a different provider type. */
export const PENDING_ONBOARDING_BUSINESS_NAME = 'Pending onboarding';

export const KYC_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type KycStatus = (typeof KYC_STATUSES)[keyof typeof KYC_STATUSES];

export const KYC_DOCUMENT_TYPES = {
  GOVERNMENT_ID: 'GOVERNMENT_ID',
  BUSINESS_LICENSE: 'BUSINESS_LICENSE',
  PROFESSIONAL_CERTIFICATE: 'PROFESSIONAL_CERTIFICATE',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  OTHER: 'OTHER',
} as const;

export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[keyof typeof KYC_DOCUMENT_TYPES];

/** Specific document a KYC upload is (GOVERNMENT_ID alone can't tell Aadhaar from PAN, and the
 * provider app's Documents screen shows each one's own status). */
export const KYC_DOCUMENT_NAMES = {
  AADHAAR_CARD: 'AADHAAR_CARD',
  PAN_CARD: 'PAN_CARD',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  POLICE_VERIFICATION: 'POLICE_VERIFICATION',
  OTHER: 'OTHER',
} as const;

export type KycDocumentName = (typeof KYC_DOCUMENT_NAMES)[keyof typeof KYC_DOCUMENT_NAMES];

export const KYC_DOCUMENT_STATUSES = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type KycDocumentStatus = (typeof KYC_DOCUMENT_STATUSES)[keyof typeof KYC_DOCUMENT_STATUSES];
