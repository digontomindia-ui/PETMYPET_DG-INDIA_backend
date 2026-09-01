import type { HydratedDocument, Types } from 'mongoose';

export interface IReview {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId | null;
  productId: Types.ObjectId | null;
  /** A review left on another pet's companion profile — requires the reviewer to have an
   * existing match with that pet (see review.service.ts's createPetReview). */
  petId: Types.ObjectId | null;
  userId: Types.ObjectId;
  providerId: Types.ObjectId | null;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;
