import { randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { userRepository } from '../users/user.repository.js';
import { UserModel } from '../users/user.schema.js';
import { walletService } from '../wallet/wallet.service.js';
import { WALLET_TRANSACTION_REASONS } from '../wallet/wallet.constants.js';
import { referralRepository } from './referral.repository.js';
import { ReferralModel } from './referral.schema.js';
import { toReferralHistoryDto } from './referral.mapper.js';
import {
  REFERRAL_CODE_LENGTH,
  REFERRAL_REWARD_POINTS,
  REFERRAL_SHARE_BASE_URL,
  REFERRAL_STATUSES,
} from './referral.constants.js';
import type { ListReferralHistoryQuery } from './referral.dto.js';

function generateCandidateCode(userId: string): string {
  // Seed with a slice of the user id plus a random suffix so codes are short, shareable,
  // and collisions are rare enough that a few retries (see ensureReferralCode) are enough.
  const seed = userId.slice(-4).toUpperCase();
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return `${seed}${suffix}`.slice(0, REFERRAL_CODE_LENGTH);
}

async function ensureReferralCode(userId: string): Promise<string> {
  const user = await userRepository.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.referralCode) return user.referralCode;

  // ponytail: retry-on-collision loop rather than a dedicated code-reservation table; the unique
  // sparse index on User.referralCode is the actual correctness guarantee here.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCandidateCode(userId);
    const existing = await UserModel.findOne({ referralCode: code });
    if (!existing) {
      user.referralCode = code;
      await user.save();
      return code;
    }
  }
  throw AppError.internal('Could not generate a unique referral code, please try again');
}

export const referralService = {
  /** Called right after a referred user's signup completes. Idempotent per referee. */
  async recordSignup(referrerId: string, refereeId: string): Promise<void> {
    const existing = await referralRepository.findOne({
      refereeId: new Types.ObjectId(refereeId),
    });
    if (existing) return;

    await referralRepository.create({
      referrerId: new Types.ObjectId(referrerId),
      refereeId: new Types.ObjectId(refereeId),
      status: REFERRAL_STATUSES.PENDING,
      rewardPoints: REFERRAL_REWARD_POINTS,
    });
  },

  /**
   * Rewards both sides of a referral once the referee's first booking reaches COMPLETED.
   * Safe to call unconditionally: no-op if there's no PENDING referral for this user.
   *
   * NOT YET WIRED UP: add `await referralService.onFirstBookingCompleted(booking.userId.toString())`
   * in src/modules/bookings/booking.service.ts, inside `verifyEndOtp`, right after
   * `booking.status = BOOKING_STATUSES.COMPLETED; ... await booking.save();` (see report).
   */
  async onFirstBookingCompleted(userId: string): Promise<void> {
    const referral = await referralRepository.findOne({
      refereeId: new Types.ObjectId(userId),
      status: REFERRAL_STATUSES.PENDING,
    });
    if (!referral) return;

    referral.status = REFERRAL_STATUSES.REWARDED;
    await referral.save();

    await walletService.credit(
      referral.referrerId.toString(),
      referral.rewardPoints,
      WALLET_TRANSACTION_REASONS.REFERRAL_BONUS,
      referral._id.toString(),
      'Referral bonus: your referred friend completed their first booking',
    );
    await walletService.credit(
      referral.refereeId.toString(),
      referral.rewardPoints,
      WALLET_TRANSACTION_REASONS.REFERRAL_BONUS,
      referral._id.toString(),
      'Referral bonus: welcome reward for joining via a referral',
    );
  },

  async getMe(userId: string) {
    const referralCode = await ensureReferralCode(userId);
    const referrerId = new Types.ObjectId(userId);
    const [totalReferrals, successfulReferrals, pendingReferrals] = await Promise.all([
      referralRepository.count({ referrerId }),
      referralRepository.count({ referrerId, status: REFERRAL_STATUSES.REWARDED }),
      referralRepository.count({ referrerId, status: REFERRAL_STATUSES.PENDING }),
    ]);

    return {
      referralCode,
      shareLink: `${REFERRAL_SHARE_BASE_URL}/${referralCode}`,
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      // rewardPoints is always REFERRAL_REWARD_POINTS per record, so this avoids a second query.
      rewardPointsEarned: successfulReferrals * REFERRAL_REWARD_POINTS,
    };
  },

  async getHistory(userId: string, query: ListReferralHistoryQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter = { referrerId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      referralRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      referralRepository.count(filter),
    ]);

    const referees = await userRepository.findMany({
      _id: { $in: items.map((item) => item.refereeId) },
    });
    const nameById = new Map(referees.map((user) => [user._id.toString(), user.name]));

    const referrals = items.map((item) =>
      toReferralHistoryDto(item, nameById.get(item.refereeId.toString()) ?? 'Unknown user'),
    );
    return { referrals, total, page, limit };
  },

  async redeem(userId: string) {
    const filter = {
      referrerId: new Types.ObjectId(userId),
      status: REFERRAL_STATUSES.REWARDED,
      redeemedAt: null,
    };
    const unredeemed = await referralRepository.findMany(filter);
    if (unredeemed.length === 0) {
      throw AppError.badRequest('No reward points available to redeem');
    }

    const redeemedPoints = unredeemed.reduce((sum, item) => sum + item.rewardPoints, 0);
    await ReferralModel.updateMany(
      { _id: { $in: unredeemed.map((item) => item._id) } },
      { redeemedAt: new Date() },
    );

    const wallet = await walletService.credit(
      userId,
      redeemedPoints,
      WALLET_TRANSACTION_REASONS.REFERRAL_BONUS,
      null,
      'Redeemed referral reward points to wallet balance',
    );

    return { redeemedPoints, wallet };
  },
};
