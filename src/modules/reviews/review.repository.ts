import { BaseRepository } from '../../common/repositories/base.repository.js';
import { ReviewModel } from './review.schema.js';
import type { IReview } from './review.types.js';

export class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(ReviewModel);
  }

  async findByBookingId(bookingId: string) {
    return this.model.findOne({ bookingId }).exec();
  }

  async findForProvider(providerId: string, skip: number, limit: number) {
    const filter = { providerId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}

export const reviewRepository = new ReviewRepository();
