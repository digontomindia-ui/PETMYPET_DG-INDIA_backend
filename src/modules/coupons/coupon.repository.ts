import mongoose, { Types } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository.js';
import { CouponModel, CouponRedemptionModel } from './coupon.schema.js';
import type { ICoupon } from './coupon.types.js';

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

  /** Atomically bumps usageCount (only if still under any configured limit) and logs the redemption. */
  async redeem(
    couponId: string,
    userId: string,
    bookingId: string,
    discountAmount: number,
  ): Promise<boolean> {
    const session = await mongoose.startSession();
    try {
      let succeeded = false;

      await session.withTransaction(async () => {
        const filter: Record<string, unknown> = { _id: couponId };
        const coupon = await this.model.findById(couponId).session(session);
        if (!coupon) return;

        if (coupon.usageLimit !== null) {
          filter.usageCount = { $lt: coupon.usageLimit };
        }

        const updated = await this.model.findOneAndUpdate(
          filter,
          { $inc: { usageCount: 1 } },
          { session },
        );
        if (!updated) return;

        await CouponRedemptionModel.create(
          [
            {
              couponId: new Types.ObjectId(couponId),
              userId: new Types.ObjectId(userId),
              bookingId: new Types.ObjectId(bookingId),
              discountAmount,
            },
          ],
          { session },
        );
        succeeded = true;
      });

      return succeeded;
    } finally {
      await session.endSession();
    }
  }
}

export const couponRepository = new CouponRepository();
