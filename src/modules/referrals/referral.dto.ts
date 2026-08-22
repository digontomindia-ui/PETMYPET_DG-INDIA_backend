import type { z } from 'zod';
import type { listReferralHistoryQuerySchema } from './referral.validators.js';

export type ListReferralHistoryQuery = z.infer<typeof listReferralHistoryQuerySchema>;
