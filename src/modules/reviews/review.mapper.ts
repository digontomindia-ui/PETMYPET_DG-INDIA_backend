import type { ReviewDocument } from './review.types.js';

export function toReviewDto(review: ReviewDocument) {
  return {
    id: review._id.toString(),
    bookingId: review.bookingId.toString(),
    userId: review.userId.toString(),
    providerId: review.providerId.toString(),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}
