import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { bookingRepository } from '../bookings/booking.repository.js';
import { BOOKING_STATUSES } from '../bookings/booking.constants.js';
import { providerRepository } from '../providers/provider.repository.js';
import { productRepository } from '../marketplace/product.repository.js';
import { petRepository } from '../pets/pet.repository.js';
import { petMatchRepository } from '../pet-companion/pet-companion.repository.js';
import { UserModel } from '../users/user.schema.js';
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

async function createPetReview(userId: string, petId: string, input: CreateReviewInput) {
  const targetPet = await petRepository.findById(petId);
  if (!targetPet) throw AppError.notFound('Pet not found');
  if (targetPet.ownerId.toString() === userId) {
    throw AppError.badRequest('You cannot review your own pet');
  }

  const reviewerPets = await petRepository.findByOwner(userId);
  if (reviewerPets.length === 0) {
    throw AppError.badRequest('You need a pet to leave a companion review');
  }
  const reviewerPetIds = reviewerPets.map((pet) => pet._id.toString());
  const matches = await petMatchRepository.findMany({
    $or: [
      { petAId: { $in: reviewerPetIds }, petBId: petId },
      { petAId: petId, petBId: { $in: reviewerPetIds } },
    ],
  });
  if (matches.length === 0) {
    throw AppError.badRequest('You can only review pets your pet has matched with');
  }

  const existing = await reviewRepository.findByPetAndUser(petId, userId);
  if (existing) throw AppError.conflict('You have already reviewed this pet');

  const review = await reviewRepository.create({
    petId: targetPet._id,
    userId: new Types.ObjectId(userId),
    rating: input.rating,
    comment: input.comment,
  });

  return toReviewDto(review);
}

/** Batches in each review's author name/avatar — used for pet reviews, where the UI shows
 * "Reviews From Other Pet Parents" with the reviewer's photo, not just a rating. */
async function withAuthors<T extends { userId: string }>(
  reviews: T[],
): Promise<(T & { authorName: string; authorAvatarUrl: string | null })[]> {
  if (reviews.length === 0) return [];
  const authors = await UserModel.find({ _id: { $in: reviews.map((r) => r.userId) } })
    .select('name avatarUrl')
    .lean();
  const authorById = new Map(authors.map((author) => [author._id.toString(), author]));
  return reviews.map((review) => {
    const author = authorById.get(review.userId);
    return {
      ...review,
      authorName: author?.name ?? '',
      authorAvatarUrl: author?.avatarUrl ?? null,
    };
  });
}

export const reviewService = {
  async create(userId: string, input: CreateReviewInput) {
    if (input.bookingId) return createBookingReview(userId, input.bookingId, input);
    if (input.productId) return createProductReview(userId, input.productId, input);
    return createPetReview(userId, input.petId as string, input);
  },

  async listForProvider(query: ListReviewsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = query.productId
      ? await reviewRepository.findForProduct(query.productId, skip, limit)
      : query.petId
        ? await reviewRepository.findForPet(query.petId, skip, limit)
        : await reviewRepository.findForProvider(query.providerId as string, skip, limit);

    const dtos = items.map(toReviewDto);
    const reviews = query.petId ? await withAuthors(dtos) : dtos;
    return { reviews, total, page, limit };
  },
};
