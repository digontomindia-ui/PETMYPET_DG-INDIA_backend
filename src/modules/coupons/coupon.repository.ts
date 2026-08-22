import { Types } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository.js';
import { CouponModel, CouponRedemptionModel } from './coupon.schema.js';
import type { ICoupon, PopulatedCouponRedemption } from './coupon.types.js';

export class CouponRepository extends BaseRepository<ICoupon> {
  constructor() {
    super(CouponModel);
  }

  async findByCode(code: string) {
    return this.model.findOne({ code: code.toUpperCase() }).exec();
  }

  async countRedemptionsForUser(couponId: string, userId: string): Promise<number> {
    return CouponRedemptionModel.countDocuments({ couponId, userId }).exec();
  }

  async findRedemptionsForUser(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ items: PopulatedCouponRedemption[]; total: number }> {
    const [items, total] = await Promise.all([
      CouponRedemptionModel.find({ userId })
        .populate<{ couponId: Pick<ICoupon, '_id' | 'code'> }>('couponId', 'code')
        .sort({ redeemedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      CouponRedemptionModel.countDocuments({ userId }).exec(),
    ]);
    return { items, total };
  }

  /**
   * Bumps usageCount (only if still under any configured limit) and logs the redemption.
   * ponytail: this deployment's MongoDB is a standalone instance (no replica set), so
   * multi-document transactions aren't available. The usageCount bump is atomic on its own
   * (single-document findOneAndUpdate); if the redemption log insert then fails, we compensate
   * by reverting the bump instead of wrapping both in a transaction. Upgrade back to
   * session.withTransaction() if the deployment ever gains a replica set.
   */
  async redeem(
    couponId: string,
    userId: string,
    bookingId: string,
    discountAmount: number,
  ): Promise<boolean> {
    const coupon = await this.model.findById(couponId).exec();
    if (!coupon) return false;

    const filter: Record<string, unknown> = { _id: couponId };
    if (coupon.usageLimit !== null) {
      filter.usageCount = { $lt: coupon.usageLimit };
    }

    const updated = await this.model.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }).exec();
    if (!updated) return false;

    try {
      await CouponRedemptionModel.create({
        couponId: new Types.ObjectId(couponId),
        userId: new Types.ObjectId(userId),
        bookingId: new Types.ObjectId(bookingId),
        discountAmount,
      });
    } catch (err) {
      await this.model.updateOne({ _id: couponId }, { $inc: { usageCount: -1 } }).exec();
      throw err;
    }

    return true;
  }
}

export const couponRepository = new CouponRepository();
