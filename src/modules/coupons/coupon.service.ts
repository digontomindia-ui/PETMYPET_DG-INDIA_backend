import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { couponRepository } from './coupon.repository.js';
import { toCouponDto, toCouponRedemptionDto } from './coupon.mapper.js';
import { DISCOUNT_TYPES } from './coupon.constants.js';
import type { CreateCouponInput, ListRedemptionsQuery, UpdateCouponInput } from './coupon.dto.js';
import type { CouponValidationResult } from './coupon.dto.js';

export const couponService = {
  async create(input: CreateCouponInput) {
    const existing = await couponRepository.findByCode(input.code);
    if (existing) throw AppError.conflict('A coupon with this code already exists');

    const coupon = await couponRepository.create({
      ...input,
      code: input.code.toUpperCase(),
      maxDiscountAmount: input.maxDiscountAmount ?? null,
      usageLimit: input.usageLimit ?? null,
    });
    return toCouponDto(coupon);
  },

  async list(query: { page?: string; limit?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      couponRepository.findMany({}, { skip, limit, sort: { createdAt: -1 } }),
      couponRepository.count({}),
    ]);
    return { coupons: items.map(toCouponDto), total, page, limit };
  },

  async getById(id: string) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw AppError.notFound('Coupon not found');
    return toCouponDto(coupon);
  },

  async update(id: string, input: UpdateCouponInput) {
    const coupon = await couponRepository.updateById(id, input);
    if (!coupon) throw AppError.notFound('Coupon not found');
    return toCouponDto(coupon);
  },

  async remove(id: string): Promise<void> {
    const deleted = await couponRepository.softDeleteById(id);
    if (!deleted) throw AppError.notFound('Coupon not found');
  },

  /** Checks eligibility and computes the discount, without consuming the coupon's usage. */
  async validate(
    code: string,
    userId: string,
    bookingAmount: number,
    providerType?: string,
  ): Promise<CouponValidationResult> {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon || !coupon.isActive) throw AppError.notFound('Coupon not found or inactive');

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw AppError.badRequest('Coupon is not valid at this time');
    }
    if (bookingAmount < coupon.minBookingAmount) {
      throw AppError.badRequest(
        `Coupon requires a minimum booking amount of ${coupon.minBookingAmount}`,
      );
    }
    if (
      coupon.applicableProviderTypes.length > 0 &&
      providerType &&
      !coupon.applicableProviderTypes.includes(providerType as never)
    ) {
      throw AppError.badRequest('Coupon is not applicable to this provider type');
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw AppError.badRequest('Coupon usage limit has been reached');
    }

    const userRedemptions = await couponRepository.countRedemptionsForUser(
      coupon._id.toString(),
      userId,
    );
    if (userRedemptions >= coupon.perUserLimit) {
      throw AppError.badRequest('You have already used this coupon the maximum number of times');
    }

    const discountAmount =
      coupon.discountType === DISCOUNT_TYPES.PERCENTAGE
        ? Math.min(
            (bookingAmount * coupon.discountValue) / 100,
            coupon.maxDiscountAmount ?? Number.POSITIVE_INFINITY,
          )
        : Math.min(coupon.discountValue, bookingAmount);

    return {
      couponId: coupon._id.toString(),
      code: coupon.code,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  },

  /** The caller's own coupon redemption history. */
  async listMyRedemptions(userId: string, query: ListRedemptionsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await couponRepository.findRedemptionsForUser(userId, skip, limit);
    return { redemptions: items.map(toCouponRedemptionDto), total, page, limit };
  },

  /** Consumes the coupon's usage; called only after the booking it applies to is actually created. */
  async redeem(
    couponId: string,
    userId: string,
    bookingId: string,
    discountAmount: number,
  ): Promise<void> {
    const succeeded = await couponRepository.redeem(couponId, userId, bookingId, discountAmount);
    if (!succeeded) throw AppError.conflict('Coupon usage limit was reached, please try again');
  },
};
