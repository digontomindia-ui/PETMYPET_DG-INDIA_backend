export const UPLOAD_CATEGORIES = {
  AVATAR: 'AVATAR',
  PET_PHOTO: 'PET_PHOTO',
  KYC_DOCUMENT: 'KYC_DOCUMENT',
  PROVIDER_PORTFOLIO: 'PROVIDER_PORTFOLIO',
  COMMUNITY_POST: 'COMMUNITY_POST',
  PRODUCT: 'PRODUCT',
  BANNER: 'BANNER',
  CHAT_ATTACHMENT: 'CHAT_ATTACHMENT',
  LOST_AND_FOUND: 'LOST_AND_FOUND',
  SUPPORT_TICKET: 'SUPPORT_TICKET',
} as const;

export type UploadCategory = (typeof UPLOAD_CATEGORIES)[keyof typeof UPLOAD_CATEGORIES];

export const UPLOAD_FOLDERS: Record<UploadCategory, string> = {
  AVATAR: 'patmypets/avatars',
  PET_PHOTO: 'patmypets/pet-photos',
  KYC_DOCUMENT: 'patmypets/kyc-documents',
  PROVIDER_PORTFOLIO: 'patmypets/provider-portfolio',
  COMMUNITY_POST: 'patmypets/community-posts',
  PRODUCT: 'patmypets/products',
  BANNER: 'patmypets/banners',
  CHAT_ATTACHMENT: 'patmypets/chat-attachments',
  LOST_AND_FOUND: 'patmypets/lost-and-found',
  SUPPORT_TICKET: 'patmypets/support-tickets',
};

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];

export const ALLOWED_MIME_TYPES_BY_CATEGORY: Record<UploadCategory, string[]> = {
  AVATAR: IMAGE_MIME_TYPES,
  PET_PHOTO: IMAGE_MIME_TYPES,
  KYC_DOCUMENT: DOCUMENT_MIME_TYPES,
  PROVIDER_PORTFOLIO: IMAGE_MIME_TYPES,
  COMMUNITY_POST: IMAGE_MIME_TYPES,
  PRODUCT: IMAGE_MIME_TYPES,
  BANNER: IMAGE_MIME_TYPES,
  CHAT_ATTACHMENT: DOCUMENT_MIME_TYPES,
  LOST_AND_FOUND: IMAGE_MIME_TYPES,
  SUPPORT_TICKET: DOCUMENT_MIME_TYPES,
};

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
