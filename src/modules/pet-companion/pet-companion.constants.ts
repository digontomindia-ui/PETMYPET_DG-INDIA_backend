export const PET_SWIPE_MODEL_NAME = 'PetSwipe';
export const PET_MATCH_MODEL_NAME = 'PetMatch';

export const SWIPE_ACTIONS = { LIKE: 'LIKE', PASS: 'PASS', SUPERLIKE: 'SUPERLIKE' } as const;

export type SwipeAction = (typeof SWIPE_ACTIONS)[keyof typeof SWIPE_ACTIONS];

export const LIKE_ACTIONS = [SWIPE_ACTIONS.LIKE, SWIPE_ACTIONS.SUPERLIKE] as const;

export const DEFAULT_DISCOVER_RADIUS_METERS = 50_000;
