import type { ReviewDocument } from './review.types.js';

export function toReviewDto(review: ReviewDocument) {
  return {
    id: review._id.toString(),
    bookingId: review.bookingId ? review.bookingId.toString() : null,
    productId: review.productId ? review.productId.toString() : null,
    userId: review.userId.toString(),
    providerId: review.providerId ? review.providerId.toString() : null,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}
