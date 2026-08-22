export const RELOCATION_REQUEST_MODEL_NAME = 'RelocationRequest';

export const TRANSPORT_TYPES = { ROAD: 'ROAD', AIR: 'AIR', RAIL: 'RAIL' } as const;

export type TransportType = (typeof TRANSPORT_TYPES)[keyof typeof TRANSPORT_TYPES];

export const TIME_SLOTS = { MORNING: 'MORNING', AFTERNOON: 'AFTERNOON', EVENING: 'EVENING' } as const;

export type TimeSlot = (typeof TIME_SLOTS)[keyof typeof TIME_SLOTS];

export const RELOCATION_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  CONTACTED: 'CONTACTED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

export type RelocationStatus = (typeof RELOCATION_STATUSES)[keyof typeof RELOCATION_STATUSES];
