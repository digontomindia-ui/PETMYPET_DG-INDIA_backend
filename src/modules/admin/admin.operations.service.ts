import type { FilterQuery } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { UserModel } from '../users/user.schema.js';
import { PetModel } from '../pets/pet.schema.js';
import { ServiceModel } from '../services/service.schema.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { toPublicProvider } from '../providers/provider.mapper.js';
import { BookingModel } from '../bookings/booking.schema.js';
import { BOOKING_STATUSES } from '../bookings/booking.constants.js';
import { ReviewModel } from '../reviews/review.schema.js';
import { toReviewDto } from '../reviews/review.mapper.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import { auditLogService } from './admin.service.js';
import { AUDIT_ACTIONS } from './admin.constants.js';
import type {
  AdminListBookingsQuery,
  AdminListProvidersQuery,
  AdminListReviewsQuery,
} from './admin.dto.js';
import type { IProvider } from '../providers/provider.types.js';
import type { IBooking } from '../bookings/booking.types.js';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** One batched lookup of names for a page of rows — every admin table shows people/things by
 * name, while the documents only carry ids. */
async function namesById(model: 'user' | 'provider' | 'service' | 'pet', ids: unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map<string, { name: string; phone?: string; email?: string | null }>();
  const rows =
    model === 'user'
      ? await UserModel.find({ _id: { $in: unique } }).select('name phone email').lean()
      : model === 'provider'
        ? (await ProviderModel.find({ _id: { $in: unique } }).select('businessName').lean()).map((p) => ({
            _id: p._id,
            name: p.businessName,
          }))
        : model === 'service'
          ? await ServiceModel.find({ _id: { $in: unique } }).select('name').lean()
          : await PetModel.find({ _id: { $in: unique } }).select('name').lean();
  return new Map(
    rows.map((row) => [
      row._id.toString(),
      row as { name: string; phone?: string; email?: string | null },
    ]),
  );
}

export const adminOperationsService = {
  async listProviders(query: AdminListProvidersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: FilterQuery<IProvider> = {};
    if (query.providerType) filter.providerType = query.providerType;
    if (query.kycStatus) filter.kycStatus = query.kycStatus;
    if (query.isActive) filter.isActive = query.isActive === 'true';
    if (query.search) filter.businessName = { $regex: escapeRegex(query.search), $options: 'i' };

    const [providers, total] = await Promise.all([
      ProviderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      ProviderModel.countDocuments(filter),
    ]);
    const owners = await namesById('user', providers.map((p) => p.userId));
    const items = providers.map((provider) => {
      const owner = owners.get(provider.userId.toString());
      return {
        ...toPublicProvider(provider),
        suspendedByAdmin: provider.suspendedByAdmin,
        ownerName: owner?.name ?? '',
        ownerPhone: owner?.phone ?? '',
        ownerEmail: owner?.email ?? null,
      };
    });
    return { items, total, page, limit };
  },

  /** Full admin view of one provider: KYC documents, masked bank account, owner contact, and the
   * booking/earnings numbers support needs when a provider calls in. */
  async getProvider(id: string) {
    const provider = await ProviderModel.findById(id).exec();
    if (!provider) throw AppError.notFound('Provider not found');

    const [owner, bookingStats, serviceCount] = await Promise.all([
      UserModel.findById(provider.userId).select('name phone email isBlocked createdAt').lean(),
      BookingModel.aggregate<{ _id: string; count: number; payout: number; gross: number }>([
        { $match: { providerId: provider._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            payout: { $sum: '$providerPayoutAmount' },
            gross: { $sum: { $subtract: ['$price', '$discountAmount'] } },
          },
        },
      ]),
      ServiceModel.countDocuments({ providerId: provider._id, isDeleted: false }),
    ]);

    const byStatus = Object.fromEntries(bookingStats.map((row) => [row._id, row.count]));
    const completed = bookingStats.find((row) => row._id === BOOKING_STATUSES.COMPLETED);
    return {
      ...toPublicProvider(provider),
      // Private profile fields — admin view only, never on the public provider mapper.
      suspendedByAdmin: provider.suspendedByAdmin,
      dateOfBirth: provider.dateOfBirth,
      gender: provider.gender,
      skills: provider.skills,
      workExperience: provider.workExperience.map((w) => ({
        id: w._id.toString(),
        title: w.title,
        company: w.company,
        startDate: w.startDate,
        endDate: w.endDate,
      })),
      owner: owner
        ? {
            id: owner._id.toString(),
            name: owner.name,
            phone: owner.phone,
            email: owner.email ?? null,
            isBlocked: owner.isBlocked ?? false,
          }
        : null,
      stats: {
        bookingsByStatus: byStatus,
        totalBookings: bookingStats.reduce((sum, row) => sum + row.count, 0),
        completedBookings: completed?.count ?? 0,
        grossRevenue: completed?.gross ?? 0,
        providerEarnings: completed?.payout ?? 0,
        serviceCount,
      },
    };
  },

  /** Suspend/reactivate a provider. A suspended provider is hidden from search (isActive: false)
   * and can't flip themselves back on — PATCH /providers/me/active checks `suspendedByAdmin`. */
  async setProviderStatus(actorId: string, id: string, input: { isActive: boolean; reason?: string }) {
    const provider = await ProviderModel.findById(id).exec();
    if (!provider) throw AppError.notFound('Provider not found');

    provider.isActive = input.isActive;
    provider.suspendedByAdmin = !input.isActive;
    await provider.save();

    await notificationService.notify({
      userId: provider.userId.toString(),
      type: NOTIFICATION_TYPES.GENERIC,
      title: input.isActive ? 'Account reactivated' : 'Account suspended',
      body: input.isActive
        ? 'Your provider account is active again.'
        : `Your provider account has been suspended${input.reason ? `: ${input.reason}` : '.'}`,
    });
    await auditLogService.record(
      actorId,
      input.isActive ? AUDIT_ACTIONS.PROVIDER_REACTIVATED : AUDIT_ACTIONS.PROVIDER_SUSPENDED,
      'Provider',
      id,
      { reason: input.reason ?? null },
    );
    return toPublicProvider(provider);
  },

  async listBookings(query: AdminListBookingsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: FilterQuery<IBooking> = {};
    if (query.status) filter.status = { $in: query.status.split(',') };
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.providerId) filter.providerId = query.providerId;
    if (query.userId) filter.userId = query.userId;
    if (query.from || query.to) {
      filter.scheduledStart = {
        ...(query.from ? { $gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
        ...(query.to ? { $lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
      };
    }

    const [bookings, total] = await Promise.all([
      BookingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BookingModel.countDocuments(filter),
    ]);
    const [users, providers, services, pets] = await Promise.all([
      namesById('user', bookings.map((b) => b.userId)),
      namesById('provider', bookings.map((b) => b.providerId)),
      namesById('service', bookings.map((b) => b.serviceId)),
      namesById('pet', bookings.map((b) => b.petId)),
    ]);

    const items = bookings.map((b) => ({
      id: b._id.toString(),
      status: b.status,
      paymentStatus: b.paymentStatus,
      scheduledStart: b.scheduledStart,
      scheduledEnd: b.scheduledEnd,
      price: b.price,
      discountAmount: b.discountAmount,
      commissionAmount: b.commissionAmount,
      providerPayoutAmount: b.providerPayoutAmount,
      currency: b.currency,
      user: { id: b.userId.toString(), name: users.get(b.userId.toString())?.name ?? '', phone: users.get(b.userId.toString())?.phone ?? '' },
      provider: { id: b.providerId.toString(), name: providers.get(b.providerId.toString())?.name ?? '' },
      serviceName: services.get(b.serviceId.toString())?.name ?? '',
      petName: b.petId ? (pets.get(b.petId.toString())?.name ?? '') : '',
      cancelledBy: b.cancelledBy,
      cancellationReason: b.cancellationReason,
      createdAt: b.createdAt,
    }));
    return { items, total, page, limit };
  },

  async listReviews(query: AdminListReviewsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { providerId: { $ne: null } };
    if (query.providerId) filter.providerId = query.providerId;
    if (query.rating) filter.rating = Number(query.rating);

    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      ReviewModel.countDocuments(filter),
    ]);
    const [users, providers] = await Promise.all([
      namesById('user', reviews.map((r) => r.userId)),
      namesById('provider', reviews.map((r) => r.providerId)),
    ]);
    const items = reviews.map((review) => {
      const dto = toReviewDto(review);
      return {
        ...dto,
        authorName: users.get(dto.userId)?.name ?? '',
        providerName: dto.providerId ? (providers.get(dto.providerId)?.name ?? '') : '',
      };
    });
    return { items, total, page, limit };
  },

  /** Removes an abusive/fake review and recomputes the provider's rating from what's left
   * (the incremental average in applyRating can't "un-apply" a single rating exactly). */
  async deleteReview(actorId: string, id: string) {
    const review = await ReviewModel.findByIdAndDelete(id).exec();
    if (!review) throw AppError.notFound('Review not found');

    if (review.providerId) {
      const [agg] = await ReviewModel.aggregate<{ avg: number; count: number }>([
        { $match: { providerId: review.providerId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      await ProviderModel.updateOne(
        { _id: review.providerId },
        { rating: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.count ?? 0 },
      );
    }
    await auditLogService.record(actorId, AUDIT_ACTIONS.REVIEW_DELETED, 'Review', id, {
      rating: review.rating,
      comment: review.comment,
    });
  },
};
