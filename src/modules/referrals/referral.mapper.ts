import type { IReferral } from './referral.types.js';

export function toReferralHistoryDto(
  referral: IReferral,
  refereeName: string,
  refereeAvatarUrl: string | null,
) {
  return {
    id: referral._id.toString(),
    refereeName,
    refereeAvatarUrl,
    status: referral.status,
    rewardPoints: referral.rewardPoints,
    createdAt: referral.createdAt,
  };
}
