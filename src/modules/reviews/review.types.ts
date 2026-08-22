import type { HydratedDocument, Types } from 'mongoose';

export interface IReview {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId | null;
  productId: Types.ObjectId | null;
  userId: Types.ObjectId;
  providerId: Types.ObjectId | null;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;
