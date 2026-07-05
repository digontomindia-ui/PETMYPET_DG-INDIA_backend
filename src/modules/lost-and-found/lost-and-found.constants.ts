export const LOST_AND_FOUND_MODEL_NAME = 'LostAndFoundPost';

export const LOST_AND_FOUND_TYPES = { LOST: 'LOST', FOUND: 'FOUND' } as const;

export type LostAndFoundType = (typeof LOST_AND_FOUND_TYPES)[keyof typeof LOST_AND_FOUND_TYPES];

export const LOST_AND_FOUND_STATUSES = { ACTIVE: 'ACTIVE', RESOLVED: 'RESOLVED' } as const;

export type LostAndFoundStatus =
  (typeof LOST_AND_FOUND_STATUSES)[keyof typeof LOST_AND_FOUND_STATUSES];

export const APPROVAL_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[keyof typeof APPROVAL_STATUSES];
