import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { bookingRepository } from '../bookings/booking.repository.js';
import { BOOKING_STATUSES } from '../bookings/booking.constants.js';
import { providerRepository } from '../providers/provider.repository.js';
import { productRepository } from '../marketplace/product.repository.js';
import { reviewRepository } from './review.repository.js';
import { toReviewDto } from './review.mapper.js';
import type { CreateReviewInput, ListReviewsQuery } from './review.dto.js';

async function createBookingReview(userId: string, bookingId: string, input: CreateReviewInput) {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.userId.toString() !== userId) {
    throw AppError.forbidden('This booking does not belong to you');
  }
  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw AppError.badRequest('You can only review completed bookings');
  }

  const existing = await reviewRepository.findByBookingId(bookingId);
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
}

async function createProductReview(userId: string, productId: string, input: CreateReviewInput) {
  // ponytail: no "must have purchased & DELIVERED" gate — findById + a plain
  // findOne for the duplicate check is trivial; cross-checking OrderModel for a
  // DELIVERED line item would mean a second query + import into every review
  // creation path for a rule nobody asked to enforce yet. Add it here if the
  // product team wants "verified purchase" reviews.
  const product = await productRepository.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const existing = await reviewRepository.findByProductAndUser(productId, userId);
  if (existing) throw AppError.conflict('You have already reviewed this product');

  const review = await reviewRepository.create({
    productId: product._id,
    userId: new Types.ObjectId(userId),
    rating: input.rating,
    comment: input.comment,
  });

  return toReviewDto(review);
}

export const reviewService = {
  async create(userId: string, input: CreateReviewInput) {
    return input.bookingId
      ? createBookingReview(userId, input.bookingId, input)
      : createProductReview(userId, input.productId as string, input);
  },

  async listForProvider(query: ListReviewsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = query.productId
      ? await reviewRepository.findForProduct(query.productId, skip, limit)
      : await reviewRepository.findForProvider(query.providerId as string, skip, limit);
    return { reviews: items.map(toReviewDto), total, page, limit };
  },
};
