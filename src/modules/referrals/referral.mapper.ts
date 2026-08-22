import type { IReferral } from './referral.types.js';

export function toReferralHistoryDto(referral: IReferral, refereeName: string) {
  return {
    id: referral._id.toString(),
    refereeName,
    status: referral.status,
    rewardPoints: referral.rewardPoints,
    createdAt: referral.createdAt,
  };
}
