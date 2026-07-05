import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { bookingRepository } from '../bookings/booking.repository.js';
import { BOOKING_STATUSES } from '../bookings/booking.constants.js';
import { providerRepository } from '../providers/provider.repository.js';
import { reviewRepository } from './review.repository.js';
import { toReviewDto } from './review.mapper.js';
import type { CreateReviewInput, ListReviewsQuery } from './review.dto.js';

export const reviewService = {
  async create(userId: string, input: CreateReviewInput) {
    const booking = await bookingRepository.findById(input.bookingId);
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.userId.toString() !== userId) {
      throw AppError.forbidden('This booking does not belong to you');
    }
    if (booking.status !== BOOKING_STATUSES.COMPLETED) {
      throw AppError.badRequest('You can only review completed bookings');
    }

    const existing = await reviewRepository.findByBookingId(input.bookingId);
    if (existing) throw AppError.conflict('You have already reviewed this booking');

    const review = await reviewRepository.create({
      bookingId: booking._id,
      userId: booking.userId,
      providerId: booking.providerId,
      rating: input.rating,
      comment: input.comment,
    });

    await providerRepository.applyRating(booking.providerId.toString(), input.rating);

    return toReviewDto(review);
  },

  async listForProvider(query: ListReviewsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await reviewRepository.findForProvider(query.providerId, skip, limit);
    return { reviews: items.map(toReviewDto), total, page, limit };
  },
};
