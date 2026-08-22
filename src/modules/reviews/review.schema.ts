import { model, Schema } from 'mongoose';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PROVIDER_MODEL_NAME } from '../providers/provider.constants.js';
import { BOOKING_MODEL_NAME } from '../bookings/booking.constants.js';
import { PRODUCT_MODEL_NAME } from '../marketplace/product.constants.js';
import { REVIEW_MODEL_NAME } from './review.constants.js';
import type { IReview } from './review.types.js';

const reviewSchema = new Schema<IReview>({
  bookingId: { type: Schema.Types.ObjectId, ref: BOOKING_MODEL_NAME, default: null },
  productId: { type: Schema.Types.ObjectId, ref: PRODUCT_MODEL_NAME, default: null },
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 2000 },
  createdAt: { type: Date, default: () => new Date() },
});

// ponytail: defense-in-depth only — the Zod refine in review.validators.ts already
// enforces this at the API boundary; this guards direct model.create() callers.
reviewSchema.pre('validate', function enforceExactlyOneTarget(next) {
  if (Boolean(this.bookingId) === Boolean(this.productId)) {
    next(new Error('Exactly one of bookingId or productId must be set'));
    return;
  }
  next();
});

reviewSchema.index({ bookingId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ providerId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, createdAt: -1 });

export const ReviewModel = model<IReview>(REVIEW_MODEL_NAME, reviewSchema);
